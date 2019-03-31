const editor =  document.getElementById('editor');
var app = new Vue({
    el: '#content',
    data: {
        editor: document.getElementById('editor'),
        text: "",
        textLength: 0,
        keyPressed: "",
        prevPosition: 0,
        buckets: null,
        onEdit: 0,
        remoteEdit: 0,
    },
    created() {
        this.initBuckets();
        console.log("Refreshing textbox");
        
        setInterval( async () => {
            try {
                const queue = await axios.get('/api/diff');
                _.map(queue.data, (change) => {
                    if(change.delete !== undefined)
                        this.recv_delete(change);
                    else
                        this.recv_update(change);
                });
            } catch(e) {
                console.error(e);
            }
        }, 500);
    },
    watch: {
        onEdit(){
            const arr_text = this.buckets.reduce((a, b) => a + b.content, '');
            const ll_crawler = (text, b) => {
                if(null === b)
                    return text;
                return ll_crawler(text + b.content, b.next);
            };
            const ll_text = ll_crawler('', this.buckets[0]);
        },
        
        remoteEdit() {
            const cursorPos = editor.selectionStart;
            console.log("old postion: "+cursorPos);
            
            this.text = _.reduce(this.buckets, (txt, bucket) => {
                return txt + bucket.content;
            }, '');

            console.log("remote edit: "+this.text);
            
            console.log("Updating cursor to position "+cursorPos);
            editor.selectionStart = cursorPos;
            editor.selectionEnd = editor.selectionStart;
            
        },
    },
    methods: {
        async initBuckets(){
            this.buckets = new Array();
            const bucket0 = {gid:0, content:'', next:null};
            this.buckets.push(bucket0);

            const change_list = await axios.get('/api');
            console.log(change_list);
            _.map(change_list.data, (change) => {
                if(change.delete !== undefined)
                    this.recv_delete(change);
                else
                    this.recv_update(change);
            });
        },
        makeBucket(character){
            return {gid:this.guidGen(), content: character, next:null};
        },
        guidGen(){
            return Math.floor(Math.random() *(10**12));
        },
        keyPress(event){
            this.keyPressed = event.key;
            //this.keyPressed = String.fromCharCode(event.keyCode);
            this.prevPosition = event.srcElement.selectionStart;

            console.log(event);

            // Character replacements
            if(this.keyPressed === "Enter"){
                this.keyPressed = "\n";
            }
        },
        send_delete(bucket) {
            try {
                const res = axios.delete('/api/' + bucket.gid);
            } catch(e) {
                console.log(e);
            }
        },
        send_update(prev, newb) {
            try {
                const res = axios.post('/api', {
                    prev: prev.gid,
                    gid: newb.gid,
                    content: newb.content,
                    next: newb.next === null? null:newb.next.gid
                });
            } catch(e) {
                console.log(e);
            }
        },
        recv_delete(change) {
            let prev = this.buckets[0];
            let index = 0;
            this.buckets.forEach((bucket, i) => {
                if(bucket.gid !== change.delete) {
                    prev = bucket;
                    return;
                }
                prev.next = bucket.next;
                index = i;
            });
            if(index === 0)
                return;
            this.buckets.splice(index, 1);

            // Run remoteEdit() to redraw the editor.
            this.remoteEdit++;
        },
        recv_update(change) {
            let prev = this.buckets[0];
            let next = null;
            let index = 0;
            this.buckets.forEach((bucket, i) => {
                if(bucket.gid === change.prev) {
                    prev = bucket;
                    index = i;
                    return;
                }
                if(bucket.gid === change.next) {
                    next = bucket;
                    return;
                }
            });
            const newb = {
                'gid': change.gid,
                'content': change.content,
                next,
            };
            prev.next = newb;
            this.buckets.splice(index+1, 0, newb);

            // Run remoteEdit() to redraw the editor.
            this.remoteEdit++;
        },
        editorChanged(event){
            const target = event.srcElement;
            const cursor = target.selectionStart;

            // Handle special-case keys:
            if(this.keyPressed === "Backspace"){
                const firstBucket = this.buckets[cursor];
                const killedBucket = this.buckets[this.prevPosition];
                const nextBucket = killedBucket.next;
                firstBucket.next = nextBucket;
                this.buckets.splice(cursor+1,1);
                this.send_delete(killedBucket);
            }else if(this.keyPressed === "Delete"){
                const currBucket = this.buckets[cursor];
                const killedBucket = currBucket.next;
                currBucket.next = currBucket.next.next;
                this.buckets.splice(cursor+1,1);
                this.send_delete(killedBucket);
            }else{
                const prevBucket = this.buckets[this.prevPosition];
                const nextBucket = prevBucket.next;
                const newBucket = this.makeBucket(this.keyPressed);
                this.buckets.splice(cursor, 0, newBucket);
                prevBucket.next = newBucket;
                newBucket.next = nextBucket;
                this.send_update(prevBucket, newBucket);
            }
            this.prevPosition = cursor;

            // Run onEdit() to redraw the editor.
            this.onEdit++;
        },
    }
});

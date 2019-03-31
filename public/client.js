
var app = new Vue({
    el: '#content',
    data: {
        text: "",
        textLength: 0,
        keyPressed: "",
        prevPosition: 0,
        buckets: null,
        onEdit: 0,
    },
    created() {
        this.initBuckets();
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
            console.log("array: "+arr_text);
            console.log("linkedList: "+ll_text);
        },
    },
    methods: {
        initBuckets(){
            this.buckets = new Array();
            const bucket0 = {gid:this.guidGen(), content:'', next:null};
            //const bucket1 = {gid:this.guidGen(), content:'', next:null};
            //bucket0.next = bucket1;
            this.buckets.push(bucket0);
            //this.buckets.push(bucket1);
        },
        makeBucket(character){
            return {gid:this.guidGen(), content: character, next:null};
        },
        guidGen(){
            return Math.floor(Math.random() *(10**12));
        },
        keyPress(event){
            this.keyPressed = event.key;
            this.prevPosition = event.srcElement.selectionStart;

            // Character replacements
            if(this.keyPressed === "Enter"){
                this.keyPressed = "\n";
            }
        },
        delete(bucket) {
            try {
                const res = axios.delete('/api/' + bucket.gid);
            } catch(e) {
                console.log(e);
            }
        },
        update(prev, newb) {
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
                this.delete(killedBucket);
            }else if(this.keyPressed === "Delete"){
                const currBucket = this.buckets[cursor];
                const killedBucket = currBucket.next;
                currBucket.next = currBucket.next.next;
                this.buckets.splice(cursor+1,1);
                this.delete(killedBucket);
            }else{
                const prevBucket = this.buckets[this.prevPosition];
                const nextBucket = prevBucket.next;
                const newBucket = this.makeBucket(this.keyPressed);
                this.buckets.splice(cursor, 0, newBucket);
                prevBucket.next = newBucket;
                newBucket.next = nextBucket;
                console.log(newBucket);
                this.update(prevBucket, newBucket);
            }
            this.prevPosition = cursor;
            console.log(this.buckets);
            this.onEdit++;
        },
    }
});

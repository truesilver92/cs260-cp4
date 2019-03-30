
var app = new Vue({
  el: '#content',
  data: {
    text: "Put some text on me",
  },
  created() {
  },
  methods: {
      editorChanged(text){
          console.log(text);
          //this.text = text;
      },
  }
});

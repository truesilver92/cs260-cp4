var app = new Vue({
    el: '#app',
    data: {
        addedName: '',
        addedProblem: '',
        tickets: {},
        showForm: false,
        user: null,
        username: '',
        password: '',
        error: '',
    },
    created() {
        this.getUser();
        this.getTickets();
    },
    methods: {
        closeForm() {
            this.showForm = false;
        },
        async getTickets() {
            try {
                let response = await axios.get("/api/tickets");
                this.tickets = response.data;
            } catch (error) {
                console.log(error);
            }
        },
        async addTicket() {
            try {
                let response = await axios.post("/api/tickets", {
                    name: this.addedName,
                    problem: this.addedProblem
                });
                this.addedName = "";
                this.addedProblem = "";
                this.getTickets();
            } catch (error) {
                console.log(error);
            }
        },
        async deleteTicket(ticket) {
            try {
                let response = axios.delete("/api/tickets/" + ticket._id);
                this.getTickets();
            } catch (error) {
                console.log(error);
                this.toggleForm();
            }
        },
        toggleForm() {
            this.error = "";
            this.username = "";
            this.password = "";
            this.showForm = !this.showForm;
        },
        async register() {
            this.error = "";
            try {
                let response = await axios.post("/api/users", {
                    username: this.username,
                    password: this.password
                });
                this.user = response.data;
                // close the dialog
                this.toggleForm();
            } catch (error) {
                this.error = error.response.data.message;
            }
        },
        async login() {
            this.error = "";
            try {
                let response = await axios.post("/api/users/login", {
                    username: this.username,
                    password: this.password
                });
                this.user = response.data;
                // close the dialog
                this.toggleForm();
            } catch (error) {
                this.error = error.response.data.message;
            }
        },
        async logout() {
            try {
                let response = await axios.delete("/api/users");
                this.user = null;
            } catch (error) {
                // don't worry about it
            }
        },
        async getUser() {
            try {
                let response = await axios.get("/api/users");
                this.user = response.data;
            } catch (error) {
                // Not logged in. That's OK!
            }
        },
    }
});

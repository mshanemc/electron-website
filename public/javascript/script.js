Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN((c = Math.abs(c))) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt((n = Math.abs(Number(n) || 0).toFixed(c)))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return (
        s +
        (j ? i.substr(0, j) + t : "") +
        i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
        (c
            ? d +
            Math.abs(n - i)
                .toFixed(c)
                .slice(2)
            : "")
    );
};

function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

new Vue({
    el: "#app",
    data: {
        username: Cookies.get("username"),
        password: Cookies.get("username"),
        greeting: "Login",
        validLogin: false,
        account: account,
        vehicle: vehicle,
        loan: null,
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    methods: {
        changeModel: function (newModel) {
            var newVehicle = Object.assign({}, this.vehicle);
            newVehicle.model__c = newModel;
            this.swapCar(newVehicle, () => {
                this.updateVehicle();
            });
        },
        changeUsername: function (event) {
            // Password doesn't matter. Just a tiny hack to set the password to something.
            this.password = this.username;
        },
        updatePrice: function (event) {
            $.post(
                "/api/pricequote",
                serialize(this.vehicle),
                (data, textStatus) => {
                    this.vehicle.price__c = data;
                },
                "json"
            );
        },
        login: function () {
            this.username = $("#username").val();
            this.getAccount();
        },
        logout: function () {
            Cookies.set("username", "");
            window.location.href = "/";
        },
        purchase: function () {
            this.vehicle.status__c = "Purchase";
            this.updateVehicle();
        },
        apply: function () {
            this.vehicle.status__c = "Purchase";
            this.createLoan();
            this.updateVehicle();
        },
        getAccount: function () {
            $.getJSON("/api/account?username=" + this.username, data => {
                if (data) {
                    this.greeting = "Hi, " + data.firstname;
                    this.account = data;
                    Cookies.set("username", this.username);
                    $("#loginModal").modal("hide");
                    this.getVehicle();
                }
            });
        },
        getVehicle: function () {
            $.getJSON("/api/vehicle?username=" + this.username, data => {
                if (data) {
                    this.swapCar(data);
                }
            });
        },
        updateVehicle: function () {
            $.post(
                "/api/vehicle",
                serialize(this.vehicle),
                (data, textStatus) => {
                    this.vehicle = data;
                    console.log('Updated vehicle: ' + JSON.stringify(data))
                },
                "json"
            );
            this.updatePrice();
        },
        swapCar: function (vehicle, callback) {
            setTimeout(() => {
                $("#car-wrapper").css("animation-name", "driveOff");
                setTimeout(() => {
                    this.vehicle = vehicle;
                    $("#car-wrapper").css("animation-name", "driveIn");
                    if (callback instanceof Function) {
                        callback();
                    }
                }, 500);
            }, 500);
        },
        save: function () {
            var x = document.getElementById("toast");
            x.className = "show";
            setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
        },
        createLoan: function () {
            $.post(
                "/api/loan",
                serialize({
                    customer__c: this.account.sfid,
                    status__c: 'Pending',
                    model__c: this.vehicle.model__c,
                    price__c: this.vehicle.price__c,
                    terms__c: this.loan.terms__c,
                    interest__c: this.loan.interest__c,
                    downpayment__c: this.loan.downpayment__c,
                    account__c: this.account.accountid,
                    web_id__c: this.vehicle.web_id__c,
                    firstname__c: this.account.firstname,
                    lastname__c: this.account.lastname
                }),
                (data, textStatus) => {
                },
                "json"
            );
        }
    },
    created: function () {
        console.log('created');
        if (this.vehicle.status__c == "Ownership" && window.location.pathname != "/dashboard") {
            window.location.href = "/dashboard";
        }
        if (parseInt(this.vehicle.price__c) == 0 || this.vehicle.price__c == null) {
            this.updatePrice();
            this.updateVehicle();
        }
    }
});

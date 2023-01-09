import { inject, Lazy, Aurelia, BindingEngine } from 'aurelia-framework';
import { AuthService } from "aurelia-authentication";
import { Router } from 'aurelia-router';
import { Service } from './service';
import { LocalStorage } from '../../utils/storage';

var tranferOutLoader = require('../../loader/transfer-out-loader');

@inject(Aurelia, Router, BindingEngine, Service, AuthService, LocalStorage)
export class Pending {
    data = [];
    info = {
      page: 1,
      keyword: '',
   
    };

    storeTemp = [];
    store = [];
    filters = [];
    
    keyword = '';
    constructor(aurelia, router, bindingEngine, service, authService, localStorage) {
        this.aurelia = aurelia;
        this.bindingEngine = bindingEngine;
        this.router = router;
        this.service = service;
        this.localStorage = localStorage;
        this.storeId = this.localStorage.store._id;
        this.authService = authService;
        this.user = this.localStorage.me;
    }

    attached() {
        var storage = this.authService.authentication.storage;
        if (storage.get("me")) {
            this.store = JSON.parse(storage.get("me")).data.stores;
            this.storeTemp = this.store;

            this.store.forEach((s) => {
                s.toString = function () {
                  return s.name;
                }
            });
        }
    }

    async activate() {
        var destinations;
        var storage = this.authService.authentication.storage;
      
        if (storage.get("me")) {
            this.store = JSON.parse(storage.get("me")).data.stores;
            this.storeTemp = this.store;
        }
       
        // if (this.store.length > 0) {
        //     for(var i in this.store) {
        //         if(i==0)
        //         {
        //             destinations = this.store[i].code +";" ;
        //         }
        //         else
        //         {
        //             destinations +=this.store[i].code +';';
        //         }
        //     }
        // }

        // this.info.destinationName = destinations;


        this.info.keyword = '';
        console.log(this.storeTemp[0].code);
        this.info.destinationName = this.storeTemp[0].code;

        this.loadPage();
        // var result = await this.service.listPending(this.info);

        // this.data = result.data;
        // this.info = result.info;
    }

    loadPage() {
        var keyword = this.info.keyword;
        this.service.listPending(this.info)
            .then(result => {
                var resultWithReference = result.data.map(item => {

                    item["sourceReference"] = "";
                    item["destinationReference"] = "";
        
                    if (item.reference) {
                        var referenceData = tranferOutLoader(item.reference);
        
                        Promise.all([referenceData]).then(dataResult => {
                            var data = dataResult[0];
                            data.forEach(element => {
                                item.sourceReference = element.source.name;
                                item.destinationReference = element.destination.name;
                            });
                        });
                    }
                    return item;
                });
                this.data = resultWithReference;
                this.info = result.info;
                this.info.keyword = keyword;
            })
    }

    changePage(e) {
        var page = e.detail;
        this.info.page = page;
        this.loadPage();
    }

    accept(data) {
        this.router.navigateToRoute('create', { id: data._id })
    }

    create(view) {
        this.router.navigateToRoute('create');
    }

    async storeChange(e) {
        var storeName = e.srcElement.value;

        for(var i = 0; i < this.storeTemp.length; i++){
            if(this.storeTemp[i].name === storeName) {
                this.info.destinationName = this.storeTemp[i].code;
                break;
            }
        }

        this.loadPage();
    }
}

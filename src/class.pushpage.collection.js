class PushpageCollection {
    /*
    * Collection to manage multiple Pushpages
    * @constructor
    * @param {object} Array of Pushpages
    */
    constructor(pushpages) {
        // private vars
        this.pushpages = pushpages;

        // set this collection as parent for all pushpages
        pushpages.forEach((pushpage, index) => {
            pushpage.setParentCollection(this);
        });

        document.addEventListener('DOMContentLoaded', event => {
            this.bindClickEvents();
            // open pushpage on page load
            this.pageCall();
        });
        window.addEventListener('popstate', event => {
            // open pushpage on back/forward button press
            this.pageCall();
        });
    }

    /*
    * get specific pushapge from collection
    * @param {int} index -  index of the wanted pushpage
    * @param {string} index -  urlParamName of the wanted pushpage
    */
    get(index) {
        // use url parameter name instead of array index if the element is not a number
        if (isNaN(index)) {
            return this.pushpages.find(pushpage => pushpage.getUrlParamName() === index);
        }
        return this.pushpages[index];
    }

    getLength() {
        return this.pushpages.length;
    }

    add(addPushpage) {
        if (this.pushpages) {
            this.pushpages.push(addPushpage);
        } else {
            this.pushpages = [addPushpage];
        }
        // set this collection as parent
        addPushpage.setParentCollection(this);
    }

    /*
    * removes specific pushpage from the collection
    * @param {object} removePushpage -  pushpage to remove
    */
    remove(removePushpage) {
        if (this.pushpages) {
            const index = this.pushpages.findIndex(pushpage => pushpage.getUrlParamName() === removePushpage.getUrlParamName());
            this.pushpages.splice(index, 1);
        }
    }

    getCollection() {
        return this.pushpages;
    }

    isEmpty() {
        return !this.pushpages || this.pushpages.length === 0;
    }

    bindClickEvents() {
        this.pushpages.forEach(pushpage => {
            let assignedAnchors = document.querySelectorAll('a[href^="?' + pushpage.getUrlParamName() + '"]');

            assignedAnchors.forEach(anchor => {
                anchor.onclick = element => {
                    element.preventDefault();
                    element.stopPropagation();

                    let hrefValue = PushpageHelper.getUrlParameterValue(pushpage.getUrlParamName(), element.target.href);

                    pushpage.open({value: hrefValue});
                }
            });
        });
    }

    /*
    * open or close pushpages after calling from an url with parameters
    */
    pageCall() {
        let calledPushpages = this.getCalledPages();
        // filter uncalled active pushpages
        let uncalledPushpages = this.pushpages.filter(pushpage => calledPushpages.indexOf(pushpage) === -1 && pushpage.isActive());

        // open or close pushpages without changing the browser history
        calledPushpages.forEach((pushpage, index) => {
            pushpage.open({
                skipUrlParam: true,
                index: index
            });
        });
        uncalledPushpages.forEach(pushpage => {
            pushpage.close(true);
        });
    }

    /*
    * get called pushpaged from current location url parameters
    */
    getCalledPages() {
        let calledPushpages = [];

        PushpageHelper.getAllUrlParameter().forEach(parameter => {
            let calledPushpage = this.pushpages.find(pushpage => pushpage.getUrlParamName() === parameter);

            if (calledPushpage) {
                calledPushpages.push(calledPushpage);
            }
        });
        return calledPushpages;
    }
}
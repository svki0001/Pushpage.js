class Pushpage {
    /*
    * Pushpage
    * @constructor
    * @param {object} Container - html container for the pushpage
    * @param {string} fileUrl - html template file for the pushpage
    * @param {string} urlParamName - url parameter name
    * @param {string} scriptUrl - script to be executed when pushpage is called
    */
    constructor(options) {
        // instance vars
        this.Container = options.container;
        this.className = options.className;
        this.fileUrl = options.fileUrl;
        this.urlParamName = options.urlParamName;
        this.scriptUrl = options.scriptUrl;
        this.DivElement = undefined;
        this.active = false;
        this.ParentCollection = null;
    }

    getContainer() {
        return this.Container;
    }

    getFileUrl() {
        return this.fileUrl;
    }

    getUrlParamName() {
        return this.urlParamName;
    }

    getDivElement() {
        return this.DivElement;
    }

    isActive() {
        return this.active;
    }

    getParentCollection() {
        return this.ParentCollection;
    }

    setParentCollection(ParentCollection) {
        this.ParentCollection = ParentCollection;
    }

    getValue() {
        return PushpageHelper.getUrlParameterValue(this.urlParamName);
    }

    getIndex() {
        return this.ParentCollection.getCollection().findIndex(pushpage => pushpage === this);
    }

    /*
    * add url parameter and insert pushpage html
    */
    open(options) {
        if (!options) {
            options = {};
        }

        // change url parameter if it shouldn't be skipped explicitly
        let legal = options.skipUrlParam ? options.skipUrlParam : PushpageHelper.addUrlParam(this.urlParamName, options.value);

        // insert pushpage html, if not exists
        if (legal && !this.active) {
            // get pushpage html
            PushpageHelper.getHTML(this.getFileUrl(), response => {
                let fragment = document.createDocumentFragment();

                // get open pushpages to insert the current element in the right index position
                let openDivElements = this.Container.getElementsByClassName('pushpage');

                // create pushpage wrapper div
                this.DivElement = document.createElement('div');
                this.DivElement.setAttribute('name', this.urlParamName);
                this.DivElement.classList.add('pushpage');
                if (this.className) {
                    this.DivElement.classList.add(this.className);
                }

                // add active class to container
                this.Container.classList.add('pushpage-container-active');


                // insert element in the right index position
                if (openDivElements[options.index]) {
                    this.Container.insertBefore(this.DivElement, openDivElements[options.index]);
                } else {
                    this.Container.appendChild(this.DivElement);
                }

                // append html to container
                this.DivElement.innerHTML = response.documentElement.innerHTML;

                // bind close buttons
                this.bindCloseClick();

                PushpageHelper.waitFor(this.Container).then(() => {
                    // add script to page
                    if (this.scriptUrl) {
                        if (Array.isArray(this.scriptUrl)) {
                            this.scriptUrl.forEach((scrUrl) => {
                                PushpageHelper.addScript(scrUrl);
                            });
                        } else {
                            PushpageHelper.addScript(this.scriptUrl);
                        }
                    }

                    // rebind click events
                    this.ParentCollection.bindClickEvents();
                });

                this.active = true;
            });
        }
    }

    /*
    * close pushpage overlay and remove url parameter
    */
    close(skipUrlParam) {
        // add exit animation class
        this.DivElement.classList.add('is-exiting');

        // destroy after animation or transition - if there's none, destroy immediately
        let computedStyle = window.getComputedStyle(this.DivElement);

        if (computedStyle.animationDuration !== '0s' || computedStyle.transitionDuration !== '0s') {
            this.DivElement.addEventListener(PushpageHelper.whichAnimationEvent(), event => { this.destroy(event.target); });
            this.DivElement.addEventListener(PushpageHelper.whichTransitionEvent(), event => { this.destroy(event.target); });
        } else {
            this.destroy(this.DivElement);
        }

        // remove url parameter
        if (!skipUrlParam) {
            PushpageHelper.removeUrlParameter(this.urlParamName);
        }

        // change status
        this.active = false;
    }

    /*
    * remove pushpage from DOM and pushpage collection
    * @param {object} element -  html element to remove
    */
    destroy(element) {
        // remove html element#
        element.remove();

        // remove active class from container, if it was the only active one
        if (!this.Container.querySelector('.pushpage')) {
            this.Container.classList.remove('pushpage-container-active');
        }
    }

    /*
    * bind click event for close buttons
    */
    bindCloseClick() {
        let closeButtons = this.DivElement.getElementsByClassName('pushpage-close');

        Array.prototype.forEach.call(closeButtons, button => {
            button.onclick = element => {
                element.preventDefault();
                element.stopPropagation();

                this.close();
            };
        });
    }
}
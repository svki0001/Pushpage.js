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

                    pushpage.open({ value: hrefValue });
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

class PushpageHelper {
    /*
    * get html from html file
    * @param {string} fileUrl - url to the pushpage template file
    * @param {function} callback - callback method
    */
    static getHTML(fileUrl, callback) {
        // feature detection
        if (!window.XMLHttpRequest) return;

        // create new request
        let xhr = new XMLHttpRequest();

        // setup callback
        xhr.onload = function () {
            if (callback && typeof (callback) === 'function') {
                callback(this.responseXML);
            }
        };

        // get the HTML
        xhr.open('GET', fileUrl);
        xhr.setRequestHeader('Content-type', 'text/html');
        xhr.responseType = 'document';
        xhr.send();
    };

    /*
    * add url parameter to browser url
    * @param {string} urlParam - url parameter name
    * @param {string} urlParamValue - value of the url parameter
    */
    static addUrlParam(urlParam, urlParamValue) {
        // current url
        let currentPageURL = window.location.href;

        // abort if the parameter with its value is already in the current location
        if (currentPageURL.includes(urlParam)) return;

        // check if there's already any parameters
        let urlParamPrefix = currentPageURL.includes('?') ? '&' : '?';
        // add parameter to current url
        let newUrl = currentPageURL + urlParamPrefix + urlParam;

        if (urlParamValue) {
            newUrl += '=' + urlParamValue;
        }

        // change current location
        return this.changeUrl(newUrl);
    }

    /*
    * remove url parameter from browser url
    * @param {string} urlParam - url parameter name
    */
    static removeUrlParameter(urlParam) {
        let url = window.location.href;

        // split current url into path and param parts
        let urlParts = url.split('?');

        if (urlParts.length > 0) {
            // remove move the ? fromt he path part to the param part
            let urlPathPart = urlParts[0].replace('?', '');
            let urlParamPart = '?' + urlParts[1];

            // look for the url parameter with ? in front or & on both sides
            let urlParamExp = new RegExp('(\\?|&)' + urlParam + '(=)?(.*?(&|$))?');
            let urlParamMatch = urlParamExp.exec(urlParamPart)[0];
            let urlParammIndex = urlParamPart.search(urlParamExp);

            // remove the url paramater
            let newUrlParamPart = urlParamPart.replace(urlParamExp, '');

            // append new ? if the url parameter was the first but also not the only one
            if (urlParamMatch[0] == '?' && urlParamMatch.slice(-1) == '&') {
                newUrlParamPart = '?' + newUrlParamPart;
            }
            // append new & in correct index position if the url paramater is not the only one
            else if (urlParamMatch.slice(-1) == '&') {
                newUrlParamPart = newUrlParamPart.slice(0, urlParammIndex) + '&' + newUrlParamPart.slice(urlParammIndex);
            }

            let newUrl = urlPathPart + newUrlParamPart;

            // change current location
            return this.changeUrl(newUrl);
        } else {
            return url;
        }
    }

    /*
    * get all url parameter names
    */
    static getAllUrlParameter() {
        // get parameter part from url
        let urlParamPart = window.location.href.split('?');

        if (urlParamPart.length > 1) {
            // get all url parameter with values
            let urlParams = urlParamPart[1].split('&');

            // remove value from url parameter string
            urlParams.forEach((urlParam, index) => {
                if (urlParam.indexOf('=') !== -1) {
                    urlParams[index] = urlParam.slice(0, urlParam.indexOf('='));
                }
            });

            return urlParams;
        }
        return [];
    }

    /*
    * change browser history
    * @param {string} newUrl - new url to push to the browser
    */
    static changeUrl(newUrl) {
        if (history.pushState) {
            window.history.pushState({ path: newUrl }, '', newUrl);
        } else {
            document.location = newUrl;
        }

        return newUrl;
    }

    /*
    * get value from url parameter
    * @param {urlParam} name of the url parameter
    * @param {url} url to read from, if undefined the current browser url will be taken
    */
    static getUrlParameterValue(urlParam, url) {
        if (!url) {
            url = decodeURIComponent(window.location.href.substring(1));
        }
        return (RegExp(urlParam + '=' + '(.+?)(&|$)').exec(url) || [, null])[1];
    }

    /*
    * add a script from file - see: https://stackoverflow.com/a/16839744
    * @param {string} scriptUrl - url to the script
    */
    static addScript(scriptUrl) {
        // create a script tag
        let scriptTag = document.createElement('script');

        // find the first script tag in the document
        let firstScriptTag = document.getElementsByTagName('script')[0];
        scriptTag.src = scriptUrl;

        // append the script to the DOM
        firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
    }

    // wait for DOM element to be loaded
    static waitFor(element) {
        return new Promise((resolve, reject) => {

            if (element) {
                resolve(element);
                return;
            }

            let observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    let nodes = Array.from(mutation.addedNodes);
                    for (let node of nodes) {
                        if (node.matches && node.matches(selector)) {
                            observer.disconnect();
                            resolve(node);
                            return;
                        }
                    };
                });
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    }

    static whichAnimationEvent() {
        let t,
            el = document.createElement("fakeelement");

        let animations = {
            "animation": "animationend",
            "OAnimation": "oAnimationEnd",
            "MozAnimation": "animationend",
            "WebkitAnimation": "webkitAnimationEnd"
        }

        for (t in animations) {
            if (el.style[t] !== undefined) {
                return animations[t];
            }
        }
    }

    static whichTransitionEvent() {
        let t,
            el = document.createElement("fakeelement");

        let transitions = {
            "transition": "transitionend",
            "OTransition": "oTransitionEnd",
            "MozTransition": "transitionend",
            "WebkitTransition": "webkitTransitionEnd"
        }

        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    }
}

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

                // append html to container
                this.DivElement.innerHTML = response.activeElement.innerHTML;

                // insert element in the right index position
                if (openDivElements[options.index]) {
                    this.Container.insertBefore(this.DivElement, openDivElements[options.index]);
                } else {
                    this.Container.appendChild(this.DivElement);
                }

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
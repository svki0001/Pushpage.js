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
let links = document.getElementsByTagName('a');
let div = document.getElementsByTagName('div');
let mobileTextClassName = "mobile_text";
let desktopTextClassName = "desktop_text";

let mobileDivClassName = "div_mobile";
let desktopDivClassName = "div_desktop";

let interactionClassName = "interactionElement";
let interactionInitializeClassName = "interactionElementInitialize";
let interactionMobileClassName = "interactionElementMobile";

let interactionMobileAnimationClassName1 = "interactionElementMobileFirstAnimation";
let interactionMobileAnimationClassName2 = "interactionElementMobileSecondAnimation";

//Utils
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

function delay(delayInMs) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInMs);
    });
}

//Main

function setFontSize() {
    if (window.innerHeight > window.innerWidth) {
        for (let i = 0; i < links.length; i++) {
            links[i].classList.add(mobileTextClassName);
            links[i].classList.remove(desktopTextClassName);
        }
        div[0].classList.add(mobileDivClassName);
        div[0].classList.remove(desktopDivClassName);
    } else {
        for (let i = 0; i < links.length; i++) {
            links[i].classList.add(desktopTextClassName);
            links[i].classList.remove(mobileTextClassName);
        }
        div[0].classList.add(desktopDivClassName);
        div[0].classList.remove(mobileDivClassName);
    }
}

let animationStartDelay = 1;
let animationForEachElementDelay = 100;
let animationHideDelay = 50;

async function mobileInitializeAnimation() {
    let delay1 = await delay(animationStartDelay);
    for (let i = 0; i < links.length; i++) {
        links[i].classList.add(interactionMobileAnimationClassName1);
        let delay2 = await delay(animationForEachElementDelay);
    }
    let delay3 = await delay(animationHideDelay);
    for (let i = 0; i < links.length; i++) {
        links[i].classList.remove(interactionMobileAnimationClassName1);
        links[i].classList.add(interactionMobileAnimationClassName2);
        let delay4 = await delay(animationForEachElementDelay);
    }
}

async function InitializeDesktop() {
    let delayInit = await delay(animationStartDelay);
    for (let i = 0; i < links.length; i++) {
        links[i].classList.remove(interactionInitializeClassName);
        links[i].classList.add(interactionClassName);
    }
}

window.addEventListener("load", function () {
        setFontSize();
        if (isTouchDevice()) {
            for (let i = 0; i < links.length; i++) {
                links[i].classList.remove(interactionInitializeClassName);
                links[i].classList.add(interactionMobileClassName);
            }
            mobileInitializeAnimation();
        } else {
            InitializeDesktop();
        }
    }
    , false);

function reportWindowSize() {
    setFontSize();
}

window.onresize = reportWindowSize;
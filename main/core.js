//Init
let links = document.getElementsByTagName('a');
let div = document.getElementsByTagName('div');
let mobileTextClassName = "mobile_text";
let desktopTextClassName = "desktop_text";

let mainContainerId = "div_desktop";
let mainContainerDesktopParamType = "px";
let mainContainerDefaultParamType = "100%";

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
function SetFontSize() {
    if (window.innerHeight > window.innerWidth) {
        for (let i = 0; i < links.length; i++) {
            links[i].classList.add(mobileTextClassName);
            links[i].classList.remove(desktopTextClassName);
        }
    } else {
        for (let i = 0; i < links.length; i++) {
            links[i].classList.add(desktopTextClassName);
            links[i].classList.remove(mobileTextClassName);
        }
    }
    SetAdaptiveWidth();
}

function SetAdaptiveWidth() {
    let div_desktop_class = document.getElementById(mainContainerId);
    let width = mainContainerDefaultParamType;
    if (window.innerHeight <= window.innerWidth) {
        let maxWidth = links[0].offsetWidth;
        for (let i = 1; i < links.length; i++) {
            let elementWidth = links[i].offsetWidth;
            if(elementWidth > maxWidth){
                maxWidth = elementWidth;
            }
        }
        width = `${maxWidth}${mainContainerDesktopParamType}`;
    }
    div_desktop_class.style.maxWidth = width;
}

//Animations
let animationStartDelay = 1;
let animationForEachElementDelay = 100;
let animationHideDelay = 50;

async function MobileInitializeAnimation() {
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
        SetFontSize();
        if (isTouchDevice()) {
            for (let i = 0; i < links.length; i++) {
                links[i].classList.remove(interactionInitializeClassName);
                links[i].classList.add(interactionMobileClassName);
            }
            MobileInitializeAnimation();
        } else {
            InitializeDesktop();
        }
    }
    , false);

function ReportWindowSize() {
    SetFontSize();
}

window.onresize = ReportWindowSize;
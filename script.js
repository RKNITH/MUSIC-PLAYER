/** @jsx dom */

let indexSong = 0;
let isLocked = false;
let songsLength = null;
let selectedSong = null;
let loadingProgress = 0;
let songIsPlayed = false;
let progress_elmnt = null;
let songName_elmnt = null;
let sliderImgs_elmnt = null;
let singerName_elmnt = null;
let progressBar_elmnt = null;
let playlistSongs_elmnt = [];
let loadingProgress_elmnt = null;
let musicPlayerInfo_elmnt = null;
let progressBarIsUpdating = false;
let broadcastGuarantor_elmnt = null;
const root = querySelector("#root");

function App({ songs }) {
    function handleChangeMusic({ isPrev = false, playListIndex = null }) {
        if (isLocked || indexSong === playListIndex) return;

        if (playListIndex || playListIndex === 0) {
            indexSong = playListIndex;
        } else {
            indexSong = isPrev ? indexSong -= 1 : indexSong += 1;
        }

        if (indexSong < 0) {
            indexSong = 0;
            return;
        } else if (indexSong > songsLength) {
            indexSong = songsLength;
            return;
        }

        selectedSong.pause();
        selectedSong.currentTime = 0;
        progressBarIsUpdating = false;
        selectedSong = playlistSongs_elmnt[indexSong];
        selectedSong.paused && songIsPlayed ?
            selectedSong.play() :
            selectedSong.pause();

        setBodyBg(songs[indexSong].bg);
        setProperty(sliderImgs_elmnt, "--index", -indexSong);
        updateInfo(singerName_elmnt, songs[indexSong].artist);
        updateInfo(songName_elmnt, songs[indexSong].songName);
    }

    setBodyBg(songs[0].bg);

    return (
        dom("div", { class: "music-player flex-column" },
            dom(Slider, { slides: songs, handleChangeMusic: handleChangeMusic }),
            dom(Playlist, { list: songs, handleChangeMusic: handleChangeMusic })));


}

function Slider({ slides, handleChangeMusic }) {
    function handleResizeSlider({ target }) {
        if (isLocked) {
            return;
        } else if (target.classList.contains("music-player__info")) {
            this.classList.add("resize");
            setProperty(this, "--controls-animate", "down running");
            return;
        } else if (target.classList.contains("music-player__playlist-button")) {
            this.classList.remove("resize");
            setProperty(this, "--controls-animate", "up running");
            return;
        }
    }
    function handlePlayMusic() {
        if (selectedSong.currentTime === selectedSong.duration) {
            handleChangeMusic({});
        }

        this.classList.toggle("click");
        songIsPlayed = !songIsPlayed;
        selectedSong.paused ? selectedSong.play() : selectedSong.pause();
    }

    return (
        dom("div", { class: "slider center", onClick: handleResizeSlider },
            dom("div", { class: "slider__content center" },
                dom("button", { class: "music-player__playlist-button center button" },
                    dom("i", { class: "icon-playlist" })),

                dom("button", {
                    onClick: handlePlayMusic,
                    class: "music-player__broadcast-guarantor center button"
                },

                    dom("i", { class: "icon-play" }),
                    dom("i", { class: "icon-pause" })),

                dom("div", { class: "slider__imgs flex-row" },
                    slides.map(({ songName, files: { cover } }) =>
                        dom("img", { src: cover, class: "img", alt: songName })))),



            dom("div", { class: "slider__controls center" },
                dom("button", {
                    class: "slider__switch-button flex-row button",
                    onClick: () => handleChangeMusic({ isPrev: true })
                },

                    dom("i", { class: "icon-back" })),

                dom("div", { class: "music-player__info text_trsf-cap" },
                    dom("div", null,
                        dom("div", { class: "music-player__singer-name" },
                            dom("div", null, slides[0].artist))),


                    dom("div", null,
                        dom("div", { class: "music-player__subtitle" },
                            dom("div", null, slides[0].songName)))),



                dom("button", {
                    class: "slider__switch-button flex-row button",
                    onClick: () => handleChangeMusic({ isPrev: false })
                },

                    dom("i", { class: "icon-next" })),

                dom("div", {
                    class: "progress center",
                    onPointerdown: e => {
                        handleScrub(e);
                        progressBarIsUpdating = true;
                    }
                },

                    dom("div", { class: "progress__wrapper" },
                        dom("div", { class: "progress__bar center" }))))));





}

function Playlist({ list, handleChangeMusic }) {
    function loadedAudio() {
        const duration = this.duration;
        const target = this.parentElement.querySelector(
            ".music-player__song-duration");


        let min = parseInt(duration / 60);
        if (min < 10) min = "0" + min;

        let sec = parseInt(duration % 60);
        if (sec < 10) sec = "0" + sec;

        target.appendChild(document.createTextNode(`${min}:${sec}`));
    }

    function updateTheProgressBar() {
        const duration = this.duration;
        const currentTime = this.currentTime;

        const progressBarWidth = currentTime / duration * 100;
        setProperty(progressBar_elmnt, "--width", `${progressBarWidth}%`);

        if (songIsPlayed && currentTime === duration) {
            handleChangeMusic({});
        }

        if (
            indexSong === songsLength &&
            this === selectedSong &&
            currentTime === duration) {
            songIsPlayed = false;
            broadcastGuarantor_elmnt.classList.remove("click");
        }
    }

    return (
        dom("ul", { class: "music-player__playlist list" },
            list.map(({ songName, artist, files: { cover, song } }, index) => {
                return (
                    dom("li", {
                        class: "music-player__song",
                        onClick: () =>
                            handleChangeMusic({ isPrev: false, playListIndex: index })
                    },


                        dom("div", { class: "flex-row _align_center" },
                            dom("img", { src: cover, class: "img music-player__song-img" }),
                            dom("div", { class: "music-player__playlist-info  text_trsf-cap" },
                                dom("b", { class: "text_overflow" }, songName),
                                dom("div", { class: "flex-row _justify_space-btwn" },
                                    dom("span", { class: "music-player__subtitle" }, artist),
                                    dom("span", { class: "music-player__song-duration" })))),



                        dom("audio", {
                            src: song,
                            onLoadeddata: loadedAudio,
                            onTimeupdate: updateTheProgressBar
                        })));



            })));


}

function Loading() {
    return (
        dom("div", { class: "loading flex-row" },
            dom("span", { class: "loading__progress" }, "0"),
            dom("span", null, "%")));


}

function dom(tag, props, ...children) {
    if (typeof tag === "function") return tag(props, ...children);

    function addChild(parent, child) {
        if (Array.isArray(child)) {
            child.forEach(nestedChild => addChild(parent, nestedChild));
        } else {
            parent.appendChild(
                child.nodeType ? child : document.createTextNode(child.toString()));

        }
    }

    const element = document.createElement(tag);

    Object.entries(props || {}).forEach(([name, value]) => {
        if (name.startsWith("on") && name.toLowerCase() in window) {
            element[name.toLowerCase()] = value;
        } else if (name === "style") {
            Object.entries(value).forEach(([styleProp, styleValue]) => {
                element.style[styleProp] = styleValue;
            });
        } else {
            element.setAttribute(name, value.toString());
        }
    });

    children.forEach(child => {
        addChild(element, child);
    });

    return element;
}

fetch(
    "https://gist.githubusercontent.com/abxlfazl/37404417d17230a629683eb3f2f0a88a/raw/366ad64df645e94592847283a306fe2276de458e/music-info.json").

    then(respone => respone).
    then(data => data.json()).
    then(result => {
        const songs = result.songs;

        function downloadTheFiles(media, input) {
            return Promise.all(
                input.map(song => {
                    const promise = new Promise(resolve => {
                        const url = song.files[media];
                        const req = new XMLHttpRequest();
                        req.open("GET", url, true);
                        req.responseType = "blob";
                        req.send();
                        req.onreadystatechange = () => {
                            if (req.readyState === 4) {
                                if (req.status === 200) {
                                    const blob = req.response;
                                    const file = URL.createObjectURL(blob);
                                    song.files[media] = file;
                                    resolve(song);
                                }
                            }
                        };
                    });

                    promise.then(() => {
                        loadingProgress++;
                        const progress = Math.round(
                            loadingProgress / (songs.length * 2) * 100);

                        loadingProgress_elmnt.innerHTML = progress;
                    });

                    return promise;
                }));

        }

        root.appendChild(dom(Loading, null));
        loadingProgress_elmnt = querySelector(".loading__progress");

        downloadTheFiles("cover", songs).then(respone => {
            downloadTheFiles("song", respone).then(data => {
                root.removeChild(querySelector(".loading"));
                root.appendChild(dom(App, { songs: data }));

                songsLength = data.length - 1;
                progress_elmnt = querySelector(".progress");
                playlistSongs_elmnt = querySelectorAll("audio");
                sliderImgs_elmnt = querySelector(".slider__imgs");
                songName_elmnt = querySelector(".music-player__subtitle");
                musicPlayerInfo_elmnt = querySelector(".music-player__info");
                singerName_elmnt = querySelector(".music-player__singer-name");
                selectedSong = playlistSongs_elmnt[indexSong];
                progressBar_elmnt = querySelector(".progress__bar");
                broadcastGuarantor_elmnt = querySelector(
                    ".music-player__broadcast-guarantor");


                controlSubtitleAnimation(musicPlayerInfo_elmnt, songName_elmnt);
                controlSubtitleAnimation(musicPlayerInfo_elmnt, singerName_elmnt);
            });
        });
    });

function controlSubtitleAnimation(parent, child) {
    if (child.classList.contains("animate")) return;

    const element = child.firstChild;

    if (child.clientWidth > parent.clientWidth) {
        child.appendChild(element.cloneNode(true));
        child.classList.add("animate");
    }

    setProperty(child.parentElement, "width", `${element.clientWidth}px`);
}
function handleResize() {
    const vH = window.innerHeight * 0.01;
    setProperty(document.documentElement, "--vH", `${vH}px`);
}
function querySelector(target) {
    return document.querySelector(target);
}
function querySelectorAll(target) {
    return document.querySelectorAll(target);
}
function setProperty(target, prop, value = "") {
    target.style.setProperty(prop, value);
}
function setBodyBg(color) {
    setProperty(document.body, "--body-bg", color);
}
function updateInfo(target, value) {
    while (target.firstChild) {
        if (window.CP.shouldStopExecution(0)) break;
        target.removeChild(target.firstChild);
    } window.CP.exitedLoop(0);

    const targetChild_elmnt = document.createElement("div");
    targetChild_elmnt.appendChild(document.createTextNode(value));
    target.appendChild(targetChild_elmnt);
    target.classList.remove("animate");
    controlSubtitleAnimation(musicPlayerInfo_elmnt, target);
}
function handleScrub(e) {
    const progressOffsetLeft = progress_elmnt.getBoundingClientRect().left;
    const progressWidth = progress_elmnt.offsetWidth;
    const duration = selectedSong.duration;
    const currentTime = (e.clientX - progressOffsetLeft) / progressWidth;

    selectedSong.currentTime = currentTime * duration;
}

handleResize();

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);
window.addEventListener("transitionstart", ({ target }) => {
    if (target === sliderImgs_elmnt) {
        isLocked = true;
        setProperty(sliderImgs_elmnt, "will-change", "transform");
    }
});
window.addEventListener("transitionend", ({ target, propertyName }) => {
    if (target === sliderImgs_elmnt) {
        isLocked = false;
        setProperty(sliderImgs_elmnt, "will-change", "auto");
    }
    if (target.classList.contains("slider") && propertyName === "height") {
        controlSubtitleAnimation(musicPlayerInfo_elmnt, songName_elmnt);
        controlSubtitleAnimation(musicPlayerInfo_elmnt, singerName_elmnt);
    }
});
window.addEventListener("pointerup", () => {
    if (progressBarIsUpdating) {
        selectedSong.muted = false;
        progressBarIsUpdating = false;
    }
});
window.addEventListener("pointermove", e => {
    if (progressBarIsUpdating) {
        handleScrub(e, this);
        selectedSong.muted = true;
    }
});
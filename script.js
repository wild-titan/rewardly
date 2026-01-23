const screens = document.querySelectorAll(".screen")
const ribbon = document.querySelector(".ribbon")
const template = document.querySelector(".template")
const rewardIcon = template.content.querySelector(".reward")
const handlers = {
    earnModal:addEarnData,
    useModal:addUseData,
    taskModal:addTaskData
}

function sumTotalPoint(){
    const state = loadState();
    let total = 0

    state.earns.forEach(e => total += Number(e.point))
    state.uses.forEach(u => total -= u.used ? Number(u.point):0)
    state.tasks.forEach(t => total+= t.isReward ? Number(t.point):0)

    return total
}

function buttonHold(button,actionFn){ //buttonを２秒ホールドでactionFnを実行
    let timeoutId = null;
    let rafId = null;
    let start = null;
    
    function startHold(){
        const li = button.closest("li")
        const overlay = li.querySelector(".overlay")
        start = performance.now()
        
        function clearHold(){
            clearTimeout(timeoutId)
            cancelAnimationFrame(rafId)
            overlay.style.width = "0%"
            timeoutId = null
        }
        
        overlay.style.width = "0%"
        
        timeoutId = setTimeout(() => {
            actionFn.call(li);
        }, 1000);
        
        function grow(time){
            const progress = Math.min((time-start)/1000,1)
            overlay.style.width = progress*100 + "%"
            
            if(progress < 1){
                rafId = requestAnimationFrame(grow)
            }
        }
        rafId = requestAnimationFrame(grow)

    button.addEventListener("pointerup",clearHold)
    button.addEventListener("pointerleave",clearHold)
    button.addEventListener("pointercancel",clearHold)
    }

    button.addEventListener("pointerdown",startHold)
}  


function showScreen(target) {
    // targetはearnとかuse
    screens.forEach(s => s.classList.add("hidden"));
    if(target == "home") {
        ribbon.classList.add("hidden")
    }else{
        ribbon.classList.remove("hidden")
        ribbon.dataset.screen = target;
    }
    render();
    const screenEl = document.getElementById(target);
    if (screenEl !== null) screenEl.classList.remove("hidden");
}

// ナビゲーションボタンにイベントリスナーを追加
document.querySelectorAll(".navBtn").forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target')
        if (target) showScreen(target); //earn useとか。
    });
});

document.querySelectorAll(".homeBtn").forEach(btn => {
    btn.onclick = () => {
        showScreen("home");
    }
});
//モーダルを開く。
document.querySelectorAll(".addBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetData = btn.dataset.modal;
        openModal(targetData);
    });
});

function openModal(modalId) {
    const modal = document.getElementById("modal");
    const contents = document.querySelectorAll(".modalContent")
    modal.style.display = "flex";
    contents.forEach(c => c.style.display = "none");

    const modalContent = document.querySelector(`.modalContent[data-modal="${modalId}"]`);
    modalContent.style.display = "flex";
};
//モーダルの各ボタン
document.querySelectorAll(".closeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        modal.style.display = "none";
    });
});
//追加ボタン
document.querySelectorAll(".enterBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.closest(".modalContent").dataset.modal;
        const handler = handlers[target]
        if(handler && !handler(target)) return;
        modal.style.display = "none";
    });
});
document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

function loadState() {
    // ローカルストレージから状態を読み込む
    const state = localStorage.getItem("state");

    if (!state) {
        return {
            earns: [],
            tasks: [],
            uses: [],
            shortcuts: []
        }
    }

    try {
        return JSON.parse(state);
    } catch (e) {
        console.error("状態の読み込みエラー:", e);
        return {
            earns: [],
            tasks: [],
            uses: [],
            shortcuts: []
        }
    }
}

function saveState(state) {
    //編集したstateを更新
    localStorage.setItem("state", JSON.stringify(state))
}

function createEarn({ title, point, source = "manual" }) {
    //earnデータの成型
    return {
        id: "e-" + Date.now(),
        title,
        point,
        createdAt: Date.now(),
        source
    }
}

function createUse({title,point}){
    return {
        id:"u-" + Date.now(),
        title,
        point,
        used:false
    }
}

function createTask({title,point,limit}){
    return {
        id:"t-" + Date.now(),
        title,
        point,
        limit,
        isFinish:false
    }
}

function createShortcut({title,point}){
    return {
        title,
        point,
        source:"manual"
    }
}

function withState(fn) {
    //引数の関数は呼び出し元で定義する。
    //stateの編集は定義した関数で行う。
    const state = loadState();
    fn(state);
    saveState(state)
    render();
}

function addEarnData(modalId) {
    // earnデータを追加
    const modalContent = document.querySelector(`.modalContent[data-modal="${modalId}"]`);
    //toggleはラベルについてるからbutton取得のためにchildren
    const toggle = modalContent.querySelector(".toggle").children[0]
    const inputTextEl = modalContent.querySelector(".inputText");
    const inputPointEl = modalContent.querySelector(".inputPoint");

    const inputText = inputTextEl.value;
    const inputPoint = inputPointEl.value;

    if (inputText == "" || inputPoint == "") return false;
    
    console.log("獲得データ追加:", inputText, inputPoint);

    const earnData = createEarn({
        title: inputText,
        point: inputPoint,
        source: "manual"
    })


    //引数に編集処理をする関数を渡す。
    withState(state => {
        state.earns.push(earnData)
        
        if(toggle.checked){
            const stData = createShortcut({
                title:inputText,
                point:inputPoint
            })

            state.shortcuts.push(stData)
        }
    })

    inputTextEl.value = "";
    inputPointEl.value = "";

    toggle.checked =false;
    return true;
}

function addUseData(modalId){
    const modalContent = document.querySelector(`.modalContent[data-modal=${modalId}]`)
    const inputTextEl = modalContent.querySelector(".inputText");
    const inputPointEl = modalContent.querySelector(".inputPoint");

    const inputText = inputTextEl.value;
    const inputPoint = inputPointEl.value;

    if(inputText == "" || inputPoint == "") return false;
    console.log("消費データ追加",inputText,inputPoint)

    const useData = createUse({
        title:inputText,
        point:inputPoint
    })

    withState(state =>{
        state.uses.push(useData)
    })

    inputTextEl.value = ""
    inputPointEl.value = ""

    return true
}

function addTaskData(modalId){
    const modalContent = document.querySelector(`.modalContent[data-modal=${modalId}]`)
    const inputTextEl = modalContent.querySelector(".inputText")
    const inputPointEl = modalContent.querySelector(".inputPoint")
    const inputLimitEl = modalContent.querySelector(".inputLimit")

    const inputText = inputTextEl.value
    const inputPoint = inputPointEl.value
    
    const time =new Date(inputLimitEl.value).getTime()
    const inputLimit = Number.isNaN(time) ? "none":time
    
    if(inputText ==""||inputPoint==""||inputLimit<Date.now()||Number.isNaN(inputLimit)) return false;

    const taskData = createTask({
        title:inputText,
        point:inputPoint,
        limit:inputLimit,
    })

    withState(state =>{
        state.tasks.push(taskData)
    })

    inputTextEl.value =""
    inputPointEl.value =""
    inputLimitEl.value =""

    return true
}

// レンダー
function renderHome(){
    const totalPoint = sumTotalPoint();
    const point = document.querySelector(".infoPoint")
    point.textContent = totalPoint.toLocaleString()
}

function renderEarnList(earns) {
    const earnList = document.querySelector(".earnList")
    earnList.innerHTML ="";
    for (const earn of [...earns].reverse()) {
        const li = document.createElement("li")
        li.dataset.id = earn.id

        const createdAt = document.createElement("p")
        createdAt.classList.add("listCreated")
        createdAt.textContent = new Date(Number(earn.createdAt)).toLocaleDateString('ja-JP')

        const title = document.createElement("p")
        title.classList.add("listTitle")
        title.textContent = earn.title

        const point = document.createElement("p")
        point.classList.add("listPoint")
        point.textContent = "+" + earn.point.toLocaleString()+"pt"

        li.appendChild(title)
        li.appendChild(point)
        li.appendChild(createdAt)
        earnList.appendChild(li)
    }
}

function consumeUse(){
    withState(state=>{
        const result = state.uses.find(u => u.id === this.dataset.id)
        const totalPoint = sumTotalPoint();
        if(result.point > totalPoint) {
            console.log("ポイントが不足しています")
            return false;
        }
        console.log("ポイントを消費",result.title,result.point)
        result.used = true
    })
}

function createMeter(max,value){
    const meterWrap = document.createElement("div")
    const meter = document.createElement("div")
    const bar = document.createElement("div")
    const text = document.createElement("p")

    meterWrap.classList.add("meterWrap")
    meter.classList.add("listMeter")
    bar.classList.add("bar")
    
    const progress = Math.min(100,Math.floor((value/max)*100))

    text.textContent = Math.min(max,value) + "/" + max;
    bar.style.width = progress + "%"

    meter.appendChild(bar)
    meterWrap.appendChild(text)
    meterWrap.appendChild(meter)
    return meterWrap
}

function createPoint(use){
        const point = document.createElement("div")
        const value = document.createElement("p")
        const pt = document.createElement("p")

        value.classList.add("value")
        pt.classList.add("pt")

        value.textContent = use.point.toLocaleString()
        pt.textContent = "pt"

        point.appendChild(value)
        point.appendChild(pt)

        return point
    }
    
function renderUseList(uses){
    const useList =document.querySelector(".useList")
    const template = document.querySelector("template")
    useList.innerHTML = ""
    const sortedUses = [...uses].sort((a,b) => a.point - b.point)
    for(const use of sortedUses){
        if(use.used) continue;
        const li = document.createElement("li")
        li.dataset.id = use.id
        const overlay = document.createElement("div")
        overlay.classList.add("overlay")
        li.appendChild(overlay)
        buttonHold(li,consumeUse.bind(li))
        
        const icon = template.content.querySelector(".shoppingBag").cloneNode(true)
        icon.classList.add("listIcon")
        
        const title = document.createElement("p")
        title.classList.add("listTitle","useTitle")
        title.textContent = use.title
        
        const point = createPoint(use)
        point.classList.add("listPoint","usePoint")
        
        const meterWrap = createMeter(use.point,sumTotalPoint())

        li.appendChild(icon)
        li.appendChild(title)
        li.appendChild(point)
        li.appendChild(meterWrap)
        useList.append(li)
    }
}

function formatTimeDiff(limit){
    if(limit=="none") return "期限なし"
    const diffSec = Math.floor((new Date(Number(limit)).getTime()-Date.now())/1000)
    if(diffSec<0) return "期限切れ"
    let timeDiffText = "期限まで"
    const day = Math.floor(diffSec/86400)
    if(day<1){
        const hour = Math.floor(diffSec/3600)
        const minute = Math.floor(diffSec%3600/60)
        timeDiffText += hour+"時間"+minute+"分"
    }else{
        timeDiffText += day+"日"
    }
    return timeDiffText
}

function consumeTask(){
    const check = this.querySelector(".isFinish")
    withState(state=>{
        const task = state.tasks.find(t=>t.id === this.dataset.id)
        task.isFinish = !task.isFinish
        if(task.isFinish && !task.isReward){
            task.isReward = true
            console.log("ポイント獲得")
        }     
    })
}

function renderTask(task,taskList){
    const li = document.createElement("li")
    const isExpired = task.limit !== "none" && task.limit < Date.now() //期限切れフラグ
    if(isExpired) li.classList.add("expired")
    if(task.isFinish) li.classList.add("finished") //終了フラグが真ならクラス付与
    li.dataset.id = task.id;

    const overlay = document.createElement("div")
    overlay.classList.add("overlay")
    li.appendChild(overlay)
    
    const check = document.createElement("button")
    check.classList.add("isFinish")
    
    if(isExpired){ 
        check.disabled = true
    }else{ //期限切れていないなら
        if(task.isReward){
            check.addEventListener("click",consumeTask.bind(li))
        }else{
            buttonHold(check,consumeTask.bind(li))
        }
    }
    check.classList.toggle("checked",task.isFinish)
    console.log(check)
    li.appendChild(check)
    
    if(task.isReward){
        const rewarded = rewardIcon.cloneNode(true)
        rewarded.classList.add("reward")
        li.appendChild(rewarded)
    }
    
    const title = document.createElement("p")
    title.classList.add("taskTitle")
    title.textContent = task.title
    
    const point = document.createElement("p")
    point.classList.add("taskPoint")
    point.textContent = "+" + task.point.toLocaleString()+"pt"

    const limit = document.createElement("p")
    limit.classList.add("listLimit")
    // limitTimeは秒単位の今との差
    limit.textContent = formatTimeDiff(task.limit)
    
    li.appendChild(title)
    li.appendChild(point)
    li.appendChild(limit)
    taskList.appendChild(li)
}

function renderTaskList(tasks){
    const taskList = document.querySelector(".taskList")
    const now = Date.now();
    const priority = (task) =>{ //sortの優先度づけ
        if(task.limit < now) return 2;
        if(task.limit === "none") return 1;
        return 0
    }
    const sortedTasks = [...tasks].sort((a,b)=>{
        const ta = priority(a)
        const tb = priority(b)

        return ta - tb;
    })

    taskList.innerHTML =""

    for(const task of sortedTasks){
        if(task.limit < now) task.isFinish = true
        if(task.isFinish) continue;
        renderTask(task,taskList)
    }
    for(const task of sortedTasks){
        if(!task.isFinish) continue;
        renderTask(task,taskList)
    }
}

function render() {
    const state = loadState();
    renderHome(state)
    renderEarnList(state.earns)
    renderUseList(state.uses)
    renderTaskList(state.tasks)
}
// 初期状態でホーム画面を表示
showScreen("home");

//一時的に置いてる。初期化
function a(){
    localStorage.clear()
    render()
} 
document.getElementById("a").addEventListener("click",a)

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/rewardly/serviceworker.js").then(reg => {
            console.log("Service Worker registered", reg);
        }).catch(err => {
            console.error("Service Worker registration failed:", err);
        });
    });
}

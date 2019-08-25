let continue_token = null;
let sessionid = null;
let profileURI = null;
let tabURIparam = 'matchhistorycompetitive';

const serverApiUrl = 'http://127.0.0.1:3000/updatematches';

const maxRetries = 3;

var matchCount = 0;

let providedCustomAPIKey = false;
let apikey = '';

const maplist = ['Mirage','Inferno','Dust II','Cache',
'Overpass','Vertigo','Nuke','Train',
'Cobblestone','Office','Aztec']

var matchStats = [];
const totalStats = {
    numberOfMatches: 0,
    totalKills: 0,
    totalAssists: 0,
    totalDeaths: 0,
    totalWins: 0,
    totalWaitTime: 0,
    totalTime: 0
};

const getSteamID64 = minProfile =>
    '76' + (parseInt(minProfile) + 561197960265728);

const parseTime = time => {
    let timeSecs = 0;
    if (time.includes(':')) {
        const i = time.indexOf(':');
        timeSecs += parseInt(time.substr(0, i)) * 60;
        timeSecs += parseInt(time.substr(i + 1));
    } else {
        timeSecs += parseInt(time);
    }
    return timeSecs;
};

const statusBar = document.createElement('div');
statusBar.style.margin = '8px 0';
statusBar.style.whiteSpace = 'pre-wrap';
const updateStatus = (text, accumulate) => {
  if (accumulate) {
    statusBar.textContent = statusBar.textContent + '\n' + text;
  } else {
    statusBar.textContent = text;
  }
};

const convertStartTime = time=>{
    time.trimRight();
    time.trimLeft();
    return time;
}

class matchStat {
    constructor(map, startTime, waitTime, matchTime,teamAScore,teamBScore,
        tap1index,tap2index,tap3index,tap4index,tap5index,
        tbp1index,tbp2index,tbp3index,tbp4index,tbp5index) {
        this.map = map;
        this.startTime = startTime;
        this.waitTime = waitTime;
        this.matchTime = matchTime;
        this.teamAScore = teamAScore;
        this.teamBScore = teamBScore;
        this.tap1index = tap1index;
        this.tap2index = tap2index;
        this.tap3index = tap3index;
        this.tap4index = tap4index;
        this.tap5index = tap5index;
        this.tbp1index = tbp1index;
        this.tbp2index = tbp2index;
        this.tbp3index = tbp3index;
        this.tbp4index = tbp4index;
        this.tbp5index = tbp5index;
    }
}

class playerStat {
    constructor(playerid, latency, kill, death, assist, mvp_round, hs_rate, score) {
        this.playerid = playerid;
        this.latency = latency;
        this.kill = kill;
        this.assist = assist;
        this.death = death;
        this.mvp_round = mvp_round;
        this.hs_rate = hs_rate;
        this.score = score;
    }
}


const initVariables = () => {
    const profileAnchor = document.querySelector('#global_actions .user_avatar');
    if (!profileAnchor) {
        updateStatus('Error: .user_avatar element was not found');
    }
    profileURI = profileAnchor.href;
    if (!document.querySelector('#load_more_button')) {
        updateStatus(
            'No "LOAD MORE HISTORY" button is present, seems like there are no more matches'
        );
    }
    const steamContinueScript = document.querySelector(
        '#personaldata_elements_container+script'
    );
    const matchContinueToken = steamContinueScript.text.match(
        /g_sGcContinueToken = '(\d+)'/
    );
    if (!matchContinueToken) {
        updateStatus('Error: g_sGcContinueToken was not found');
    }
    continue_token = matchContinueToken[1];
    const steamSessionScript = document.querySelector('#global_header+script');
    const matchSessionID = steamSessionScript.text.match(/g_sessionID = "(.+)"/);
    if (!matchSessionID) {
        updateStatus('Error: g_sessionID was not found');
    }
    sessionid = matchSessionID[1];
    const tabOnEl = document.querySelector('.tabOn');
    if (tabOnEl) {
        tabURIparam = tabOnEl.parentNode.id.split('_').pop();
    }
    if (typeof content !== 'undefined') fetch = content.fetch; // fix for Firefox with disabled third-party cookies
};

const getMatchStats = () => {
    const profileURItrimmed = profileURI.replace(/\/$/, '');
    const anchors = document.querySelectorAll(
        '.inner_name .playerAvatar ' +
        `a[href]:not(.extension-counted)`
    );
    const myAnchors = document.querySelectorAll(
        '.inner_name .playerAvatar ' +
        `a[href="${profileURItrimmed}"]:not(.extension-counted)`
    );
    const matchesData = document.querySelectorAll(
        '.val_left:not(.extension-counted)'
    );
    totalStats.numberOfMatches = matchesData.length;
    let playersAmount = anchors.length;
    let playercount = 0;
    matchesData.forEach((match, index) => {
        let map,startTime,waitTime,matchTime;
        let teamAScore,teamBScore;
        let scores = document.getElementsByClassName('csgo_scoreboard_score')[index].textContent.trim();
        teamAScore = parseInt(scores);
        teamBScore = parseInt(scores.slice(scores.indexOf(':')+1));
        match.querySelectorAll('td').forEach((dataEl, dataIndex) =>{
            let data = dataEl.innerText.trim();
            let i = data.indexOf(':');
            switch (dataIndex) {
                case 0:
                    maplist.forEach(mapname => {
                        if(data.includes(mapname)){
                            map = mapname;
                        }
                    });
                    break;
                case 1: 
                    startTime = convertStartTime(data);
                    break;
                case 2:
                    waitTime = parseTime(data.substr(i+1));//单位是秒
                    break;
                case 3:
                    matchTime = parseTime(data.substr(i+1));
                    break;
            }
        })
        document.getElementsByClassName('csgo_scoreboard_score')
        var matchPlayerArray = [];
        for(let i = 0; i < 10;i++){
            let playerstat = anchors[playercount+i].closest('tr').querySelectorAll('td');
            let shortid = playerstat[0].getElementsByTagName('a')[0].getElementsByTagName('img')[0].attributes[2].value;
            let playerid = getSteamID64(shortid);
            let latency = parseInt(playerstat[1].textContent,10);
            let kill = parseInt(playerstat[2].textContent,10);
            let assist = parseInt(playerstat[3].textContent,10);
            let death = parseInt(playerstat[4].textContent,10);
            let mvp_round = parseInt(playerstat[5].textContent.slice(1),10);       
            if(Number.isNaN(mvp_round))mvp_round = 0;
            if(playerstat[5].textContent == '★')mvp_round = 1;
            let hs_rate = parseFloat(playerstat[6].textContent)/100.0;
            if(Number.isNaN(parseFloat(playerstat[6].textContent)))hs_rate = 0;
            let score = parseInt(playerstat[7].textContent,10);
            matchPlayerArray[i] = new playerStat(playerid,latency,kill,death,assist,mvp_round,hs_rate,score);
            anchors[playercount+i].classList.add(
                'extension-counted'
            );
        }
        matchStats[matchStats.length] = new matchStat(map,startTime,
            waitTime,matchTime,teamAScore,teamBScore,
            matchPlayerArray[0],matchPlayerArray[1],matchPlayerArray[2],
            matchPlayerArray[3],matchPlayerArray[4],matchPlayerArray[5],
            matchPlayerArray[6],matchPlayerArray[7],matchPlayerArray[8],
            matchPlayerArray[9]);
        match.classList.add('extension-counted');
        playercount+=10;
    });
    
}

const uploadMatchHistory = ()=>{
    console.log(matchStats);
    $.ajax({
        type:'POST',
        url:serverApiUrl,
        contentType:"application/json",
        dataType:"json",
        data:JSON.stringify(matchStats),
        success:function(data){
            updateStatus('发送成功！');
        }
    })
}

const fetchMatchHistoryPage = (recursively, page, retryCount) => {
    document.querySelector('#load_more_button').style.display = 'none';
    document.querySelector('#inventory_history_loading').style.display = 'block';
    fetch(
        `${profileURI}gcpd/730?ajax=1&tab=${tabURIparam}&continue_token=${continue_token}&sessionid=${sessionid}`,
        {
            credentials: 'include'
        }
    )
        .then(res => {
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    return res.json();
                } else {
                    return res.text();
                }
            } else {
                throw Error(`Code ${res.status}. ${res.statusText}`);
            }
        })
        .then(json => {
            if (!json.success) {
                throw Error(
                    'error getting valid JSON in response to\n' +
                    `${profileURI}gcpd/730?ajax=1&tab=${tabURIparam}&continue_token=${continue_token}&sessionid=${sessionid}`
                );
            }
            if (json.continue_token) {
                continue_token = json.continue_token;
            } else {
                updateStatus(
                    'No continue_token returned from Steam, looks like there are no more matches to load!'
                );
                continue_token = null;
            }
            const parser = new DOMParser(); // todo: don't create new parser for each request
            const newData = parser.parseFromString(json.html, 'text/html');
            let elementsToAppend = '.csgo_scoreboard_root > tbody > tr';
            let elementToAppendTo = '.csgo_scoreboard_root';
            if (tabURIparam === 'playerreports' || tabURIparam === 'playercommends') {
                elementsToAppend = 'tbody > tr';
                elementToAppendTo = '.generic_kv_table tbody';
            }
            newData.querySelectorAll(elementsToAppend).forEach((tr, i) => {
                if (i > 0) document.querySelector(elementToAppendTo).appendChild(tr);
            });
            getMatchStats();
            if (recursively && continue_token) {
                updateStatus(`Loaded ${page ? page + 1 : 1} page${page ? 's' : ''}...`);
                fetchMatchHistoryPage(true, page ? page + 1 : 1, maxRetries);
            } else {
                updateStatus('');
                if (!continue_token) {
                    document.querySelector('#inventory_history_loading').style.display =
                        'none';
                } else {
                    document.querySelector('#load_more_button').style.display =
                        'inline-block';
                    document.querySelector('#inventory_history_loading').style.display =
                        'none';
                }
            }
        })
        .catch(error => {
            updateStatus(
                `Error while loading match history:\n${error}` +
                `${
                retryCount !== undefined && retryCount > 0
                    ? `\n\nRetrying to fetch page... ${maxRetries -
                    retryCount}/${maxRetries}`
                    : `\n\nCouldn't load data after ${maxRetries} retries :(`
                }`
            );
            if (retryCount > 0) {
                setTimeout(
                    () => fetchMatchHistoryPage(true, page, retryCount - 1),
                    3000
                );
            }
            document.querySelector('#load_more_button').style.display =
                'inline-block';
            document.querySelector('#inventory_history_loading').style.display =
                'none';
        });
};

const fetchMatchHistory = () => {
    if (continue_token && sessionid && profileURI) {
        console.log(
            `First continue token: ${continue_token} | SessionID: ${sessionid} | Profile: ${profileURI}`
        );
        updateStatus('Loading Match history...');
        fetchMatchHistoryPage(true, 1, maxRetries);
    }
};

const menu = document.createElement('div');
menu.style.padding = '0 14px';
menu.id = 'banchecker-menu';

const createSteamButton = (text, iconURI) => {
    const button = document.createElement('div');
    // pullup_item class style replication using js
    // TODO: move to separate css file for sanity
    button.style.display = 'inline-block';
    button.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )';
    button.style.padding = '3px 8px 0px 0px';
    button.style.borderRadius = '2px';
    button.style.marginRight = '6px';
    button.style.cursor = 'pointer';
    button.style.lineHeight = '18px';
    button.style.color = '#66c0f4';
    button.style.fontSize = '11px';
    button.onmouseover = () => {
        button.style.backgroundColor = 'rgba( 102, 192, 244, 0.4 )';
        button.style.color = '#ffffff';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )';
        button.style.color = '#66c0f4';
    };
    const iconEl = document.createElement('div');
    iconEl.className = 'menu_ico';
    iconEl.style.display = 'inline-block';
    iconEl.style.verticalAlign = 'top';
    iconEl.style.padding = iconURI ? '1px 7px 0 6px' : '1px 8px 0 0';
    iconEl.style.minHeight = '22px';
    if (iconURI) {
        const image = document.createElement('img');
        image.src = iconURI;
        image.width = '16';
        image.height = '16';
        image.border = '0';
        iconEl.appendChild(image);
    }
    button.appendChild(iconEl);
    const textNode = document.createTextNode(text);
    button.appendChild(textNode);
    return button;
};

const fetchButton = createSteamButton('读取所有对战记录');
fetchButton.onclick = () => {
    fetchMatchHistory();
    fetchButton.onclick = () => {
        updateStatus(
            '你已经按过这个按钮了，如果想要重新加载请刷新页面'
        );
    };
};
menu.appendChild(fetchButton);

chrome.storage.sync.get(['customapikey'], data => {
    if (typeof data.customapikey === 'undefined') {
        const defaultkeys = [
            '5DA40A4A4699DEE30C1C9A7BCE84C914',
            '5970533AA2A0651E9105E706D0F8EDDC',
            '2B3382EBA9E8C1B58054BD5C5EE1C36A'
        ];
        apikey = defaultkeys[Math.floor(Math.random() * 3)];
        // statusBar.textContent =
        //     'Only 100 players from the most recent matches will be scanned without providing your own API key!';
    } else {
        providedCustomAPIKey = true;
        apikey = data.customapikey;
    }
    // fetchButton.insertAdjacentElement('afterend', checkBansButton);
});
menu.appendChild(statusBar);

document.querySelector('#subtabs').insertAdjacentElement('afterend', menu);

initVariables();
getMatchStats();

const loadMoreButton = document.querySelector('#load_more_button');
document.querySelector('.load_more_history_area').appendChild(loadMoreButton);
document.querySelector('.load_more_history_area a').remove();
loadMoreButton.onclick = () => fetchMatchHistoryPage(false, null, maxRetries);


// embed settings
let settingsInjected = false;
const showSettings = () => {
    if (settingsInjected) {
        const settingsShade = document.getElementById('settingsShade');
        const settingsDiv = document.getElementById('settingsDiv');
        settingsShade.className = 'fadeIn';
        settingsDiv.className = 'fadeIn';
    } else {
        settingsInjected = true;
        fetch(chrome.extension.getURL('/options.html'))
            .then(resp => resp.text())
            .then(settingsHTML => {
                const settingsDiv = document.createElement('div');
                settingsDiv.id = 'settingsDiv';
                settingsDiv.innerHTML = settingsHTML;
                document.body.appendChild(settingsDiv);
                const settingsShade = document.createElement('div');
                settingsShade.id = 'settingsShade';
                settingsShade.addEventListener('click', hideSettings);
                document.body.appendChild(settingsShade);
                initOptions();
                showSettings();
            });
    }
};
const hideSettings = () => {
    const settingsShade = document.getElementById('settingsShade');
    const settingsDiv = document.getElementById('settingsDiv');
    settingsShade.className = 'fadeOut';
    settingsDiv.className = 'fadeOut';
    chrome.storage.sync.get(['customapikey'], data => {
        if (typeof data.customapikey !== 'undefined' && !providedCustomAPIKey) {
            location.reload();
        } else {
            updateStatus('Reload the page if you changed API key!');
        }
    });
};
const bancheckerSettingsButton = createSteamButton('设置Steam API key');
bancheckerSettingsButton.onclick = () => showSettings();
statusBar.insertAdjacentElement('beforeBegin', bancheckerSettingsButton);

const uploadMatchesButton = createSteamButton('上传已加载的战绩');
uploadMatchesButton.onclick = () => uploadMatchHistory();
statusBar.insertAdjacentElement('beforebegin', uploadMatchesButton);
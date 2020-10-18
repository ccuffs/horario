var Horarios = {};

const DEFAULT_TABLE_HEADER = "<th></th><th>Segunda-feira</th><th>Terça-feira</th><th>Quarta-feira</th><th>Quinta-feira</th><th>Sexta-feira</th></tr>";
const weekDays = ['07:30', '10:20', '13:30', '16:00', '19:10', '21:00'];

const ICON_USER = '<img class="icon" src="./assets/icons/user.svg" />';
const ICON_INFO = '<img class="icon" src="./assets/icons/info.svg" />';

Horarios.Viewer = function() {
    this.groups = null;
    this.schedule = null;
    this.meta = null;

    this.init = function(config = {}) {
        const propsConfig = ['groups', 'schedule', 'meta'];

        this.load(config.schedule || './data/schedule-2020-1.json', 'schedule');
        this.load(config.groups || './data/groups-2020-1.json', 'groups');
        this.load(config.meta || './data/meta-2020-1.json', 'meta');
    
        this.waitUntilLoaded(propsConfig, () => this.render('app'), this);
    };

    this.handleEmptyPeriod = (period) => `<td>${period}</td><td>━</td><td>━</td><td>━</td><td>━</td><td>━</td>`;

    this.handleCellPeriod = ({ id, name, members }, courses) => {
        let boxInfo = ''; 

        const membersElement = `<p>${ICON_USER}${members.join(`</p><p>${ICON_USER}`)}</p>`;
        const nameElement = `<strong>${name}</strong>`;
        
        const ttt = courses[id];
        if(ttt) {
            if(ttt.info) {
                boxInfo = `<span class="info">${ICON_INFO}${ttt.info}</span>`;
            } else {
                boxInfo = `<span class="alert">${ICON_INFO}${ttt.warn}</span>`;
            }
        }
        return `<td class='cell-active'><div>${nameElement}${boxInfo}${membersElement}</div></td>`;
    }

    this.handleNewPeriod = (period, subjects, courses) => {
        const periodTime = weekDays[period - 2];
        const subjectsPeriods = subjects.filter( subject => subject.period === period );
            
        const isEmptyPeriod = !subjectsPeriods.length;
        // Retorna uma linha sem matérias
        if(isEmptyPeriod) return this.handleEmptyPeriod(periodTime);

        let periodLine = `<td>${periodTime}</td>`;

        for(let weekDay = 2; weekDay < 7; weekDay += 1) {
            let value = '━';

            const subjectPeriod = subjectsPeriods.findIndex( periods => periods.weekDay === weekDay );

            const cellPeriod = subjectPeriod === -1 ? '<td>━</td>' : this.handleCellPeriod(subjectsPeriods[subjectPeriod], courses);

            periodLine += cellPeriod;
        }
        return periodLine;
    };

    this.handleTableGroup = (tableId, subjects, courses) => {
        for(let period = 2; period < 8; period += 1){
            const trTable = document.createElement('tr');
            trTable.innerHTML = this.handleNewPeriod(period, subjects, courses);
            document.getElementById(tableId).appendChild(trTable);
        }
    }

    this.render = function(containerId) {
        const self = this;

        this.groups.map( group => {
            const tableId = `group-${group.id}`;

            const sectionGroup = document.createElement('section');
            sectionGroup.innerHTML = 
            `<h2>${group.name}</h2><table id="table-${tableId}"><thead><tr>${DEFAULT_TABLE_HEADER}</tr></thead><tbody id="tbody-${tableId}"></tbody></table>`;
            document.getElementById(containerId).appendChild(sectionGroup);

            const subjectsGroup = self.schedule.filter( subject => subject.group === group.id);
            self.handleTableGroup(`tbody-${tableId}`, subjectsGroup, self.meta.courses);
        });
    };

    this.waitUntilLoaded = (props, callback, context) => {
        context = context || this;
        const intervalId = setInterval(() => {
            let isReady = true;
            
            props.map( prop => isReady = prop !== null );
  
            if(isReady && callback) {
                clearInterval(intervalId);
                callback.call(context);
            }
        }, 500);    
    };

    this.load = (url, prop, callback, context) => {
        const self = this;
        const jqxhr = $.getJSON(url);

        jqxhr.done(function(response) {
            console.debug('Response received [' + prop + '] ', response);
            self[prop] = response;

            if(callback) callback.call(context, response);
        });
        
        jqxhr.fail(function(e) {
            console.error('Ajax fail for: ' + prop, url, e);
        });
    };
};
var Horarios = {};

const DEFAULT_TABLE_HEADER = "<th></th><th>Segunda-feira</th><th>Terça-feira</th><th>Quarta-feira</th><th>Quinta-feira</th><th>Sexta-feira</th></tr>";
const weekDays = ['07:30', '10:20', '13:30', '16:00', '19:10', '21:00'];

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

    this.handleTableGroup = (tableId, subjects, courses) => {
        // Percorrendo as linhas
        for(let period = 2; period < 8; period += 1){
            const trTable = document.createElement('tr');

            const subjectsPeriods = subjects.filter( subject => subject.period === period );
            
            if(subjectsPeriods.length){

                for(let weekDay = 1; weekDay < 7; weekDay += 1) {
                    let value = '━';

                    if(weekDay === 1) {
                        value =  weekDays[period - 2];
                    } else {
                        const bb = subjectsPeriods.findIndex( periods => periods.weekDay === weekDay );
                        if( bb !== -1 ) {
                            let boxInfo = ''; 

                            const members = `<p><img class="icon" src="./assets/icons/user.svg" />${subjectsPeriods[bb].members.join('</p><p><img class="icon" src="./assets/icons/user.svg" />')}</p>`;
                            const name = `<strong>${subjectsPeriods[bb].name}</strong>`;
                            
                            const ttt = courses[subjectsPeriods[bb].id];
                            if(ttt) {
                                if(ttt.info) {
                                    boxInfo = `<span class="info"><img class="icon" src="./assets/icons/info.svg" />${ttt.info}</span>`;
                                } else {
                                    boxInfo = `<span class="alert"><img class="icon" src="./assets/icons/info.svg" />${ttt.warn}</span>`;
                                }
                            }
                            value = `<div>${name}${boxInfo}${members}</div>`;
                        }
                    }
                    const classCell = value !== '━' && weekDay > 1 ? 'cell-active' : '';
                    trTable.innerHTML += `<td class="${classCell}">${value}</td>`;
                }
            } else {
                trTable.innerHTML = `<td>${weekDays[period - 2]}</td><td>━</td><td>━</td><td>━</td><td>━</td><td>━</td>`;
            }

            document.getElementById(tableId).appendChild(trTable);
        }
    }
    // linhas: period -> 1: é o cabeçalho
    // colunas: weekDay
    // tabela: group

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
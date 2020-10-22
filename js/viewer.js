var Horarios = {};

const DEFAULT_TABLE_HEADER = "<th></th><th>Segunda-feira</th><th>Terça-feira</th><th>Quarta-feira</th><th>Quinta-feira</th><th>Sexta-feira</th></tr>";
const weekDays = ['07:30', '10:20', '13:30', '16:00', '19:10', '21:00'];

const ICON_USER = '<img class="icon" src="./assets/icons/user.svg" />';
const ICON_INFO = '<img class="icon" src="./assets/icons/info.svg" />';

Horarios.Viewer = function() {
    this.groups = null;
    this.schedule = null;
    this.meta = null;
    this.courses = null;
    this.members = null;

    this.init = function(semester) {

        if(semester) {
            const propsConfig = ['courses', 'groups', 'members', 'schedule', 'meta'];
            propsConfig.forEach( prop =>  {
                if(['schedule', 'meta'].includes(prop)) {
                    this.load(`./data/${semester}/${prop}.json`, prop);
                } else {
                    this.load(`./data/${prop}.json`, prop);
                }
            });
            this.waitUntilLoaded(propsConfig, () => this.render(), this);
        }
    
    };
    // Linha vazia, sem nenhuma matéria no período
    this.handleEmptyPeriod = (period) => `<td>${period}</td><td>━</td><td>━</td><td>━</td><td>━</td><td>━</td>`;
    // Cria uma tag logo abaixo do nome da matéria.
    this.handleTagCourse = (idCourse) => {
        const self = this;
        const course = self.meta.courses[idCourse];
        
        if(course) {
            if(course.info) return `<span class="cell-tag info">${ICON_INFO}${course.info}</span>`;
            else if(course.warn) return `<span class="cell-tag alert">${ICON_INFO}${course.warn}</span>`;
        }

        return '';
    }

    this.handleNameCourse = (nameDefault, course) => {
        if(! course) return `<h6>${nameDefault}</h6>`;

        const { name, description } = course;
        const descriptionElement = `<span class="box-tooltip-content description">${description}</span>`;

        return `<div class="box-tooltip"><strong>${name}</strong>${descriptionElement}</div>`;
    }

    this.handleMembersCourse = (members, aaa) => {
        let nameMembers = '';
        members.map( member => {
            if(this.members[member]){
                const {name, email} = this.members[member];
                nameMembers += `<div class="box-tooltip"><p>${ICON_USER}${name}</p><span class="box-tooltip-content email">${email}</span></div>`
            } else {
                nameMembers += `<p>${ICON_USER}${member}</p>`
            }
        });

        return nameMembers;
    }


    this.handleCellPeriod = ({ id, name, code, members }) => {
        const self = this;

        const tagCourse = self.handleTagCourse(id);
        const nameCourse = self.handleNameCourse(name, self.courses[code]);
        const membersCourse = self.handleMembersCourse(members, self.members);

        return `<td class='cell-active'><div>${nameCourse}${tagCourse}${membersCourse}</div></td>`;
    }

    this.handleNewPeriod = (period, subjects) => {
        const periodTime = weekDays[period - 2];
        const subjectsPeriods = subjects.filter( subject => subject.period === period );
            
        // Retorna uma linha sem matérias
        const isEmptyPeriod = !subjectsPeriods.length;
        if(isEmptyPeriod) return this.handleEmptyPeriod(periodTime);
        // Primeira coluna com os horários
        let periodLine = `<td>${periodTime}</td>`;

        for(let weekDay = 2; weekDay < 7; weekDay += 1) {
            const idSubject = subjectsPeriods.findIndex( periods => periods.weekDay === weekDay );
            const cellPeriod = idSubject === -1 ? '<td>━</td>' : this.handleCellPeriod(subjectsPeriods[idSubject]);
            periodLine += cellPeriod;
        }
        return periodLine;
    };

    this.handleTableGroup = (tableId, subjects) => {
        for(let period = 2; period < 8; period += 1){
            const trTable = document.createElement('tr');
            trTable.innerHTML = this.handleNewPeriod(period, subjects);
            document.getElementById(tableId).appendChild(trTable);
        }
    }

    this.handleElementLinkGroup = (mainContent) => {
        const linksGroup = document.createElement('ul');
        linksGroup.setAttribute('id', 'links-groups');
        mainContent.appendChild(linksGroup);
    }

    this.handleNewLinkGroup = (groupId, name) => {
        const item = document.createElement('li');
        item.innerHTML = `<a href="#${groupId}">${name}</a>`;
        document.getElementById('links-groups').appendChild(item);
    }

    this.handleBannerAlert = (mainContent, banner) => {
        const boxBanner = document.createElement('div');
        boxBanner.setAttribute('id', 'box-alert');
        boxBanner.innerHTML = `${banner.icon}<h3>${banner.text}</h3>`;
       
        mainContent.appendChild(boxBanner);
    }

    this.render = function() {
        const self = this;
        const mainContent = document.getElementById('content');

        if(self.meta.banner) self.handleBannerAlert(mainContent, self.meta.banner)

        self.handleElementLinkGroup(mainContent);

        self.groups.map( group => {
            const groupId = `group-${group.id}`;
            
            self.handleNewLinkGroup(groupId, group.name);

            const sectionGroup = document.createElement('section');
            sectionGroup.setAttribute('id', groupId);

            sectionGroup.innerHTML = 
            `<h2>${group.name}<span>Aulas 100% online</span></h2>
            <table>
                <thead><tr>${DEFAULT_TABLE_HEADER}</tr></thead>
                <tbody id="tbody-${groupId}"></tbody>
            </table>`;
            
            mainContent.appendChild(sectionGroup);

            const subjectsGroup = self.schedule.filter( subject => subject.group === group.id);
            self.handleTableGroup(`tbody-${groupId}`, subjectsGroup);
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
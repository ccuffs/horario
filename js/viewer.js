var Horarios = {};

const DEFAULT_TABLE_HEADER = "<th></th><th>Segunda-feira</th><th>Terça-feira</th><th>Quarta-feira</th><th>Quinta-feira</th><th>Sexta-feira</th></tr>";
const weekDays = ['07:30', '10:20', '13:30', '16:00', '19:10', '21:00'];

const ICON_USER = '<img class="icon" src="./assets/icons/user.svg" />';
const ICON_INFO = '<img class="icon" src="./assets/icons/info.svg" />';
const ICON_LOADER = '<img class="w-8 h-8" src="./assets/icons/loader.svg" />';

Horarios.Viewer = function() {
    this.groups = null;
    this.schedule = null;
    this.meta = null;
    this.courses = null;
    this.members = null;

    this.init = function(semester) {
        if(!semester) {
            return;
        }

        const propsConfig = ['courses', 'groups', 'members', 'schedule', 'meta'];

        propsConfig.forEach( prop =>  {
            if(['schedule', 'meta', 'groups'].includes(prop)) {
                this.load(`./data/${semester}/${prop}.json`, prop);
            } else {
                this.load(`./data/${prop}.json`, prop);
            }
        });

        this.waitUntilLoaded(propsConfig, () => this.render(), this);
    };

    this.generateTooltipContent = function(element) {
        const text = element.getAttribute('data-tooltip');

        if (!text) {
            return `${ICON_LOADER}`;
        }

        return text;
    };

    this.generateCourseTooltip = function(courseData) {
        const self = this;

        const template = document.getElementById('template-tooltip-course');
        const div = template.cloneNode(true);
        
        div.innerHTML = div.innerHTML.replace(/\$\{(.*)\}/gi, function(matched) {
            const dotPath = matched.replace(/[\{\}$]/gi, '');
            console.log(dotPath, courseData);
            return self.dotObjectStringToValue(dotPath, courseData);
        });

        return div;
    };

    this.dotObjectStringToValue = function(dotString, obj) {
        function index(obj,i) {return obj[i]}
        return dotString.split('.').reduce(index, obj);
    };

    this.onTooltipShow = function(tooltip) {
        const self = this;
        const codeCourse = tooltip.reference.getAttribute('data-course');

        fetch('https://api.uffs.cc/v0/disciplinas/' + codeCourse)
            .then((response) => response.json())
            .then((data) => {
                tooltip.setContent(self.generateCourseTooltip(data));
            })
            .catch((error) => {
                tooltip.setContent(`Request failed. ${error}`);
            });
    };

    this.initTooltips = function() {
        const self = this;
        const selector = `
            [data-tooltip],
            [data-tooltip-from]`;

        tippy(selector, {
            theme: 'carbon',
            content(element) {
                return self.generateTooltipContent(element);
            },
            onShow(instance) {
                self.onTooltipShow(instance);
            },
            allowHTML: true,
            interactive: true,
            maxWidth: 400
        });
    };

    // Linha vazia, sem nenhuma matéria no período
    this.handleEmptyPeriod = (period) => `<td>${period}</td><td>━</td><td>━</td><td>━</td><td>━</td><td>━</td>`;
    // Cria uma tag informativa logo abaixo do nome da matéria
    this.handleTagCourse = (idCourse) => {
        // Regata os alertas referente a matéria do arquivo meta.json
        const course = this.meta.courses[idCourse];
        if(course) {
            if(course.info) return `<span class="cell-tag info">${ICON_INFO}${course.info}</span>`;
            else if(course.warn) return `<span class="cell-tag alert">${ICON_INFO}${course.warn}</span>`;
        }
        return '';
    }
    // Cria o campo do nome no box da matéria
    this.handleNameCourse = (nameDefault, codeCourse) => {
        const course = this.courses[codeCourse];

        if(!course) return `<div class="box-tooltip"><strong>${nameDefault}</strong></div>`;

        const { name } = course;
        return `<div class="box-tooltip" data-tooltip="" data-course="${codeCourse}"><strong>${name}</strong></div>`;
    }
    // Cria o campo dos docentes no box da matéria
    this.handleMembersCourse = (members) => {
        let nameMembers = '';
        members.map( member => {
            // Regata as informações do docente do arquivo members.json
            if(this.members[member]){
                const { name, email } = this.members[member];
                nameMembers += `<div class="box-tooltip"><p>${ICON_USER}${name}</p><div class="box-tooltip-content email">${email}</div></div>`
            } else {
                nameMembers += `<p>${ICON_USER}${member}</p>`
            }
        });
        return nameMembers;
    }
    // Cria uma célula na tabela com o valor da matéria
    this.handleCellPeriod = ({ id, name, code, members, slots }) => {
        const tagCourse = this.handleTagCourse(id);
        const nameCourse = this.handleNameCourse(name, code);
        const membersCourse = this.handleMembersCourse(members);
        const spanner = slots || 1;

        return `<td class='cell-active'><div class='cell-wrapper'><div class='spanner${spanner}'></div><div class='cell-active-content'>${nameCourse}${tagCourse}${membersCourse}</div></div></td>`;
    }
    // Adiciona as matérias na linha do periodo selecionado
    this.handleNewPeriod = (period, coursesGroup) => {
        const periodTime = weekDays[period - 2];
        const coursesGroupPeriods = coursesGroup.filter( course => course.period === period );
        // Caso não exista nenhuma matéria neste período, é retornado uma linha em branco
        const isEmptyPeriod = !coursesGroupPeriods.length;
        if(isEmptyPeriod) return this.handleEmptyPeriod(periodTime);
        // Primeira coluna com os horários
        let periodLine = `<td>${periodTime}</td>`;
        // Navegando entre as colunas da linha da tabela
        for(let weekDay = 2; weekDay < 7; weekDay += 1) {
            const indexCourse = coursesGroupPeriods.findIndex( periods => periods.weekDay === weekDay );
            const weekDayIsEmpty = indexCourse === -1;
            // Adicionando uma célula em branco
            if(weekDayIsEmpty) periodLine += '<td>━</td>';
            // Adicionando uma célula com box da matéria
            else periodLine += this.handleCellPeriod(coursesGroupPeriods[indexCourse]);
        }
        return periodLine;
    };
    // Adiciona a lista de máterias na tabela
    this.handleCoursesInTableGroup = (tableId, coursesGroup) => {
        // Navegando entre as linhas da tabela
        for(let period = 2; period < 8; period += 1){
            const trTable = document.createElement('tr');
            trTable.innerHTML = this.handleNewPeriod(period, coursesGroup);
            document.getElementById(tableId).appendChild(trTable);
        }
    }

    this.handleElementLinkGroup = (mainContent) => {
        const linksGroup = document.createElement('ul');
        linksGroup.setAttribute('id', 'links-groups');
        mainContent.appendChild(linksGroup);
    }
    // Cria um banner no topo da página
    this.handleBannerAlert = (mainContent) => {
        if(this.meta.banner){
            const { icon, text, color, head } = this.meta.banner;

            const boxBanner = document.createElement('div');
            boxBanner.innerHTML = `
                <div class="relative px-4 py-4 mb-5 leading-normal text-black bg-${color} rounded-lg" role="alert">
                    <span class="absolute inset-y-0 left-0 flex items-center ml-4 text-black">
                        <img class="h-4 w-4 fill-current text-black-100" src="${icon}" />
                    </span>
                    <p class="ml-6"><strong>${head}</strong> ${text}</p>
                </div>`
           
            mainContent.appendChild(boxBanner);
        }
    }
    // Adiciona um novo link ao grupo de links do topo da página
    this.handleNewLinkGroup = (groupId, name) => {
        const item = document.createElement('li');
        item.innerHTML = `<a href="#group-${groupId}">${name}</a>`;
        document.getElementById('links-groups').appendChild(item);
    }
    // Adiciona uma nova seção a pagina, contendo um título com o nome do semestre e a tabela.
    this.handleNewSectionGroup = (group, mainContent) => {
        const sectionGroup = document.createElement('section');
        sectionGroup.setAttribute('id', `group-${group.id}`);
        // Cria a tag informativa do semestre
        const noticeGroup = this.meta.groups[group.id] ? `<span>${this.meta.groups[group.id].notice}</span>` : ''; 
        
        sectionGroup.innerHTML = 
        `<h2>${group.name}${noticeGroup}</h2>
        <table>
            <thead><tr>${DEFAULT_TABLE_HEADER}</tr></thead>
            <tbody id="tbody-group-${group.id}"></tbody>
        </table>`;
        
        mainContent.appendChild(sectionGroup);
    };

    this.render = function() {
        const self = this;
        const mainContent = document.getElementById('content');

        if(self.meta.banner) self.handleBannerAlert(mainContent, self.meta.banner)

        self.handleElementLinkGroup(mainContent);

        self.groups.map( group => {
            // Adiciona o botão para o link de referência da tabela
            self.handleNewLinkGroup(group.id, group.name);
            // Cria uma nova seção
            self.handleNewSectionGroup(group, mainContent);

            const coursesGroup = self.schedule.filter( course => course.group === group.id);
            self.handleCoursesInTableGroup(`tbody-group-${group.id}`, coursesGroup);
        });

        self.initTooltips();
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
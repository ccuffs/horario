var Horarios = {};

const DEFAULT_TABLE_HEADER = "<th></th><th>Segunda-feira</th><th>Terça-feira</th><th>Quarta-feira</th><th>Quinta-feira</th><th>Sexta-feira</th></tr>";

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

    this.handleTableGroup = (tableId, subjects) => {
        console.log(subjects);
        const trTable = document.createElement('tr');
        trTable.innerHTML = DEFAULT_TABLE_HEADER;
        document.getElementById(tableId).appendChild(trTable);
    }

    this.render = function(containerId) {
        const self = this;

        this.groups.map( group => {
            const tableId = `table-group-${group.id}`;

            const sectionGroup = document.createElement('section');
            sectionGroup.innerHTML = `<h2>${group.name}</h2><table id="${tableId}"></table>`;
            document.getElementById(containerId).appendChild(sectionGroup);

            const subjectsGroup = self.schedule.filter( subject => subject.group === group.id);
            self.handleTableGroup(tableId, subjectsGroup);
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
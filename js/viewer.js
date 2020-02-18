// TODO: move this to API endpoint
var weekDays = [
    {id: 2, name: "Segunda-feira"},
    {id: 3, name: "Terça-feira"},
    {id: 4, name: "Quarta-feira"},
    {id: 5, name: "Quinta-feira"},
    {id: 6, name: "Sexta-feira"},
];

// TODO: move this to API endpoint
var periods = [
    {id: 2, name:"07:30", label: "Manha1"},
    {id: 3, name:"10:20", label: "Manha2"},
    {id: 4, name:"13:30", label: "Tarde1"},
    {id: 5, name:"16:00", label: "Tarde2"},
    {id: 6, name:"19:10", label: "Noite1"},
    {id: 7, name:"21:00", label: "Noite2"}
];

var Horarios = {};

Horarios.Viewer = function() {
    this.groups = null;
    this.schedule = null;

    this.init = function() {
        $('#periodo').on('change', function () {
            window.location = './' + $(this).val();
            return false;
        });

        this.load('./data/schedule-2020-1.json', 'schedule');
        this.load('./data/groups-2020-1.json', 'groups');
        
        this.waitUntilLoaded(['groups', 'schedule'], function() {
            this.render('viewer');
        }, this);
    };

    this.waitUntilLoaded = function(props, callback, context) {
        var intervalId;
        context = context || this;

        intervalId = setInterval(function() {
            var ready = true;
            
            for(prop in props) {
                var key = props[prop];

                if(context[key] == null) {
                    ready = false;
                }
            };

            if(ready && callback) {
                clearInterval(intervalId);
                callback.call(context);
            }
        }, 500);    
    };

    this.load = function(url, prop, callback, context) {
        var self = this;
        var jqxhr = $.getJSON(url);

        jqxhr.done(function(response) {
            console.debug('Response received [' + prop + '] ', response);
            self[prop] = response;

            if(callback) {
                callback.call(context, response);
            }
        });
        
        jqxhr.fail(function(e) {
            console.error('Ajax fail for: ' + prop, url, e);
        });
    };

    this.findCoursesByGroupId = function(groupId) {
        var items = [];
        
        this.schedule.forEach(function(course) {
            if(course.group == groupId) {
                items.push(course);
            }
        });
    
        return items;
    };

    this.getCourseByGroupPeriodWeekDay = function(groupId, periodId, weekDayId) {
        var items = [];
        
        this.schedule.forEach(function(course) {
            if(course.group == groupId && course.period == periodId && course.weekDay == weekDayId) {
                items.push(course);
            }
        });
    
        return items.length > 0 ? items[0] : null;
    };    

    this.render = function(containerId) {
        var container = document.getElementById(containerId);
        var self = this;
        var content;

        container.innerHTML = '';

        this.groups.map(function(group, index) {
            content = '';
            content += '<table id="table_' + group.id + '" border="1" class="odd_table  table table-striped">';
                content += '<caption><a href="#top"><i class="fa fa-arrow-circle-o-up"></i> Voltar ao topo</a></caption>';
                content += '<thead>';
                    content += '<tr>';
                        content += '<th colspan="6" class="header">' + group.name +'<br /><span class="st">Sala 401 B</span></th>';
                    content += '</tr>';
                    content += '<tr>';
                        content += '<th style="width: 5%;"></th>';
                        content += '<th style="width: 19%;">Segunda-feira</th>';
                        content += '<th style="width: 19%;">Terça-feira</th>';
                        content += '<th style="width: 19%;">Quarta-feira</th>';
                        content += '<th style="width: 19%;">Quinta-feira</th>';
                        content += '<th style="width: 19%;">Sexta-feira</th>';
                    content += '</tr>';
                content += '</thead>';
                content += '<tbody>';
                    for(var p in periods) {
                        var period = periods[p];

                        content += '<tr>';
                        content += '<td>' + period.name + '</td>';

                        for(var w in weekDays) {
                            var weekDay = weekDays[w];
                            var course = self.getCourseByGroupPeriodWeekDay(group.id, period.id, weekDay.id);

                            if(course) {
                                content += '<td>'+ course.name + '<br />' + course.members.join(', ') + '<br /><strong class="badge badge-danger"><i class="fa fa-exclamation-triangle"></i> Nova sala: 310B</strong></td>';
                            } else {
                                content += '<td>---</td>';
                            }
                        }
                        content += '</tr>';
                    }
                content += '</tbody>';
            content += '</table>';

            container.innerHTML += '<div class="row"><div class="col-12">' + content + '</div></div>';
        });
    };
};

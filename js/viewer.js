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
    this.meta = null;

    this.init = function(config) {
        config = config || {};

        $('#periodo').on('change', function () {
            window.location = './' + $(this).val();
            return false;
        });

        this.load(config.schedule || './data/schedule-2020-1.json', 'schedule');
        this.load(config.groups || './data/groups-2020-1.json', 'groups');
        this.load(config.meta || './data/meta-2020-1.json', 'meta');
        
        this.waitUntilLoaded(['groups', 'schedule', 'meta'], function() {
            this.render('viewer');

            if(this.meta.banner) {
                this.renderBanner(this.meta.banner);
            }

            console.debug('Allocated personel: ', this.findEmailsFromAllocatedPersonel());
        }, this);
    };

    this.findEmailsFromAllocatedPersonel = function() {
        if(!this.schedule) {
            console.error('Unable to find emails because nothing has been loaded yet.');
            return;
        }

        var personel = this.findAllocatedPersonel();
        var emails = [];

        personel.map(function(memberId) {
            emails.push(memberId + '@uffs.edu.br');
        });

        return emails;
    };

    this.findAllocatedPersonel = function() {
        if(!this.schedule) {
            console.error('Unable to find personel because nothing has been loaded yet.');
            return;
        }

        var people = [];

        for(var i in this.schedule) {
            this.schedule[i].members.map(function(member) {
                if(people.indexOf(member) == -1) {
                    people.push(member);
                }
            });
        }

        return people;
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

    this.renderBanner = function(banner) {
        var element = document.getElementById('banner');

        if(!element) {
            return;
        }

        if(banner.html) {
            element.innerHTML = banner.html;
        }
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

    this.displayMembers = function(members) {
        var items = [];
        var self = this;
        
        members.forEach(function(member) {
            var memberMeta = self.meta.members[member];
            items.push(memberMeta ? self.displayItemMeta(memberMeta) : '<span class="member"><i class="fa fa-user"></i> ' + member + '</span>');
        });

        return items.join('<br />');
    };

    this.displayItemMeta = function(itemMeta) {
        var content = '';

        itemMeta = itemMeta || {};

        if(itemMeta.notice) {
            content +=  itemMeta.notice;
        }

        if (itemMeta.secondary) {
            content += '<span class="badge badge-secondary">'+ itemMeta.secondary + '</span>';
        }

        if (itemMeta.alert) {
            content += '<strong class="badge badge-danger"><i class="fa fa-exclamation-triangle"></i> '+ itemMeta.alert + '</strong>';
        }
        
        if (itemMeta.warn) {
            content += '<strong class="badge badge-warning"><i class="fa fa-exclamation-circle"></i> '+ itemMeta.warn + '</strong>';
        } 
        
        if (itemMeta.info) {
            content += '<strong class="badge badge-info"><i class="fa fa-info-circle"></i> '+ itemMeta.info + '</strong>';
        }
        
        return '<span class="item-meta">' + content + '</span>';
    };

    this.render = function(containerId) {
        var container = document.getElementById(containerId);
        var self = this;
        var content;

        container.innerHTML = '';

        this.groups.map(function(group, index) {
            var groupMeta = self.meta.groups[group.id] || {};
            var groupHidePeriods = groupMeta.hidePeriods || [];

            content = '';
            content += '<table id="table_' + group.id + '" border="1" class="odd_table  table table-striped">';
                content += '<caption><a href="#top"><i class="fa fa-arrow-circle-o-up"></i> Voltar ao topo</a></caption>';
                content += '<thead>';
                    content += '<tr>';
                        content += '<th colspan="6" class="header">' + group.name + '<br />' + self.displayItemMeta(groupMeta) + '</th>';
                    content += '</tr>';
                    content += '<tr>';
                        content += '<td style="width: 5%;"></th>';
                        content += '<td style="width: 19%;">Segunda-feira</th>';
                        content += '<td style="width: 19%;">Terça-feira</th>';
                        content += '<td style="width: 19%;">Quarta-feira</th>';
                        content += '<td style="width: 19%;">Quinta-feira</th>';
                        content += '<td style="width: 19%;">Sexta-feira</th>';
                    content += '</tr>';
                content += '</thead>';
                content += '<tbody>';
                    for(var p in periods) {
                        var period = periods[p];
                        var shouldHidePeriod = groupHidePeriods.indexOf(period.id) != -1;

                        if(shouldHidePeriod) {
                            continue;
                        }

                        content += '<tr>';
                        content += '<td>' + period.name + '</td>';

                        for(var w in weekDays) {
                            var weekDay = weekDays[w];
                            var course = self.getCourseByGroupPeriodWeekDay(group.id, period.id, weekDay.id);

                            if(course) {
                                var courseMeta = self.meta.courses[course.id] || {};
                                content += '<td><strong class="course-name">'+ (courseMeta.name || course.name) + '</strong>' + self.displayItemMeta(courseMeta) + '<br /><span class="text-muted">' + self.displayMembers(course.members) + '</span></td>';
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

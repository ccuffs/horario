var Horarios = {};

Horarios.App = function() {
    this.ENDPOINT_URL = './api/v0/?';
    
    this.data = {
        program: null,
        members: {},
        programs: {}
    };
    
    this.active = {
        groupId: undefined,
        programId: 1,
        user: {id: 'fernando.bevilacqua'},
        readOnly: true
    };

    this.boot = function() {
        this.buildInitialUI();
        this.load();
    };

    this.buildInitialUI = function() {
        this.buildModals();
    };

    this.buildFinalUI = function() {
        this.buildDropdownProgramSelection();
    };

    this.buildModals = function() {
        var self = this;

        $('#modal-course button.submit').click(function(e) { self.handleModalCourseSubmit(e) });
        $('#modal-group button.submit').click(function(e) { self.handleModalGroupSubmit(e); });
    
        $('#modal-course').on('show.bs.modal', function (event) {
            var groupId = $(event.relatedTarget).data('group');
            var courseId = $(event.relatedTarget).data('course');
            var course = self.getCourseById(courseId);
            var text = '';

            self.active.groupId = groupId;

            if(course) {
                // We have existing course info for this modal. Let's update
                // all global controls with the selected course (which takes
                // precedence from everything else)
                self.active.groupId = course.group;
            }

            console.log('group:', self.active.groupId, 'course: ', courseId);

            $('#modal-course-name').val(course ? course.name : '');
            $('#modal-course-id').val(course ? course.id : '');

            for(memberId in self.data.members) {
                var member = self.data.members[memberId];
                var key = 'member-'+ memberId;
                var checked = course && course.members.includes(memberId) ? 'checked="checked"' : '';

                text += 
                    '<input class="form-check-input" type="checkbox" value="' + member.id + '" id="' + key + '" ' + checked + '>' +
                    '<label class="form-check-label" for="' + key + '">'+ member.name + ' (' + member.email + ')</label>';
            }
    
            $('#modal-course-members').html(text);
        });

        $('#modal-group').on('show.bs.modal', function (event) {
            var groupId = $(event.relatedTarget).data('group');
            var group = self.getGroupById(groupId);

            $('#modal-group-id').val(group ? group.id : '');
            $('#modal-group-name').val(group ? group.name : '');
        });
    };

    this.handleSelectProgram = function(e) {
        var anchor = $(e.currentTarget);
        var programId = anchor.data('program');

        if(programId == this.active.programId) {
            console.log('Skipping program selection because ids are not different.');
            return;
        }
    
        this.loadProgram(programId);
    }

    this.buildDropdownProgramSelection = function() {
        var self = this;

        $('#dropdownMenuProgramSelector').empty();
    
        for(p in self.data.programs) {
            var program = self.data.programs[p];
    
            if(program.id == this.active.programId) {
                $('#buttonProgramSelector').html(program.name);
                continue;
            }
    
            $('#dropdownMenuProgramSelector').append('<a class="dropdown-item" href="javascript:void(0);" data-program="' + program.id + '">' + program.name + '</a>');
        }
        
        $('#dropdownMenuProgramSelector a').click(function(e) {
            self.handleSelectProgram(e);
        });
    };

    this.loadProgram = function(programId) {
        console.log('Loading program with id=', programId);
        this.api({method: 'program', program: programId}, function(data) {
            console.log('Program loaded:', data);
            this.data.program = data;
            this.selectProgram(programId);
        }, this);
    };

    this.restoreDataFromLocalStorage = function(prgramId) {
        var c = store.get('something');
        
        if(c) {
            // TODO: restore data from database
        }
    };

    this.selectProgram = function(programId) {
        var self = this;

        this.active.programId = programId;
        console.debug('Program selected: ', programId);
    
        this.restoreDataFromLocalStorage();
    
        $('#container').empty();
    
        this.data.program.groups.forEach(function(group) {
            var courses = self.findCoursesByGroupId(group.id);
            group.grid = self.createGroupBlock('groups-content', group);

            courses.forEach(function(course) {
                group.grid.add_widget(
                    self.generateCourseGridNodeHTML(course),
                    1,
                    1,
                    course.weekDay,
                    course.period);
            });
        });

        this.buildDropdownProgramSelection();
        this.checkProgramConstraints();
    };

    this.checkProgramConstraints = function() {
        var self = this;

        this.clearConstraintHighlights();

        this.data.program.groups.forEach(function(group) {
            var courses = self.findCoursesByGroupId(group.id);
            
            courses.forEach(function(course) {
                self.checkConstraintsByCourse(course);
            });
        });
    };

    this.init = function(context) {
        var programId = 1; // TODO: select this from URL

        if(!context) {
            console.error('Invalid context data. Unable to init.');
            return;
        }

        this.data.programs = context.programs;
        this.data.members = context.members;

        console.log('List of programs updated:', this.data.programs);
        console.log('List of members updated:', this.data.members);

        this.buildFinalUI();
        this.loadProgram(programId);
    };

    this.load = function() {
        this.api({method: 'context'}, function(data) {
            this.init(data);
        }, this);
    };

    this.api = function(params, callback, context) {
        var jqxhr = $.getJSON(this.ENDPOINT_URL, params);

        jqxhr.done(function(response) {
            console.debug('Response received:', response);

            if(response.success) {
                callback.call(context, response.data);
            } else {
                console.error('Endpoint error:', response.message);
            }
        });
        
        jqxhr.fail(function(e) {
            console.error('Ajax fail', e);
        });
    };

    this.onCourseMoved = function(data) {
        var course = this.getCourseById(data.course);

        if(course == null) {
            console.error('Unable to load course info: ' + data.course);
            return;
        }

        course.period = data.row | 0;
        course.weekDay = data.col | 0;

        this.commitCourse(course);
        this.checkProgramConstraints();
    };

    this.commitCourse = function(course) {
        console.log('Commiting course', course);

        this.api({method: 'updatecourse', program: this.active.programId, course: course}, function(data) {
            console.log('Course commited successfuly!', data);
        }, this);
    };

    this.commitGroup = function(group) {
        console.log('Commiting group', group);

        // TODO: improve this
        var bareGroup = {
            id: group.id,
            name: group.name,
            grid: null
        };

        this.api({method: 'updategroup', program: this.active.programId, group: bareGroup}, function(data) {
            console.log('Group commited successfuly!', data);
        }, this);
    };

    this.loadCourses = function() {
        console.log('Loading courses', this.active.program);

        this.api({method: 'courses', program: this.active.program}, function(data) {
            console.log('Returned', data);
        }, this);
    };

    this.createGroupBlock = function(containerId, group) {
        var self = this;
        var num = group.id;
        var key = 'group-' + num;

        $('#' + containerId).append(
            '<div id="' + key + '" class="row justify-content-center section" style="' + (group.hidden ? 'display:none;' : '') + '">' +
                '<div class="col-lg-12 schedule-block">' +
                    '<div class="card text-white status-meta">' +
                        '<div class="card-header alert alert-secondary">' +
                            '<h2 class="float-left"><i class="icon ion-md-today"></i> ' + group.name + ' ' + (this.active.readOnly ? '' : '<a href="javascript:void(0);" data-group="'+ group.id +'" data-toggle="modal" data-target="#modal-group"><i class="icon ion-md-create edit"></i></a>') + '</h2>' +
                            (this.active.readOnly ? '' : '<button type="button" class="btn btn-outline-light ml-md-3 float-right" data-toggle="modal" data-target="#modal-course" data-group="' + group.id + '"><i class="icon ion-md-add-circle"></i> Adicionar CCR</button>') +
                        '</div>' +
                        '<div class="card-body">' +
                            '<div class="gridster"><ul></ul></div>'+
                        '</div>' +
                        //'<div class="card-footer text-muted"></div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    
        var g = $('#' + key +' div.gridster ul').gridster({
            widget_base_dimensions: ['auto', 80],
            autogenerate_stylesheet: true,
            shift_widgets_up: false,
            shift_larger_widgets_down: false,
            min_cols: 8,
            max_cols: 8,
            max_rows: 7,
            min_rows: 7,
            widget_margins: [5, 5],
            resize: {
                enabled: false
            },
            collision: {
                wait_for_mouseup: true
            },
            draggable: {
                handle: 'header',
    
                start: function (e, ui) {
                    console.debug('START position: ' + ui.position.top + ' ' + ui.position.left);
                },
    
                drag: function (e, ui) {
                    console.debug('DRAG offset: ' + ui.pointer.diff_top + ' ' + ui.pointer.diff_left);
                },
    
                stop: function (e, ui) {
                    var data = ui.$helper.context.dataset;
                    self.onCourseMoved(data);
                }
            }
        }).data('gridster');

       
        for(var i = 0; i < periods.length; i++) {
            g.add_widget(this.generateGridNodeHTML(periods[i].name, {}, false), 1, 1, 1, i + 1);
        }

        g.add_widget(this.generateGridNodeHTML('', {}, false), 1, 1, 1, 1);

        for(var j = 0; j < weekDays.length; j++) {
            g.add_widget(this.generateGridNodeHTML(weekDays[j].name, {}, false), 1, 1, 1, 1);
        }



        return g;
    }
    
    this.generateGridNodeHTML = function(content, data, clickable) {
        var complement = '';
        var shouldClick = clickable == undefined ? true : clickable;
        var attributes = data || {};

        for(var a in attributes) {
            complement += 'data-' + a + '="' + attributes[a] + '" ';
        }

        return '<li class="new ' + (shouldClick ? '' : 'fixed' ) + ' ' + (this.active.readOnly ? 'readonly' : '') + '" ' + complement + '><header></header>' + (content || '') + '</li>';
    };


    this.generateCourseGridNodeHTML = function(course) {
        var content = 
            '<div class="course-node" id="course-node-' + course.id + '">' +
                '<div class="header ' + (this.active.readOnly ? 'readonly' : '') +'">' +
                    '<div class="btn-group">' +
                        '<button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" data-display="static" aria-haspopup="true" aria-expanded="false">' +
                            '<i class="fa fa-options"></i>' +
                        '</button>' +
                        '<div class="dropdown-menu dropdown-menu-lg-right">' +
                            '<button class="dropdown-item" type="button" data-toggle="modal" data-target="#modal-course" data-course="' + course.id + '"><i class="icon ion-md-create edit"></i> Editar</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' + 
                '<div class="side">' + 
                    '' +
                '</div>' +
                '<div class="content">' + 
                    '<strong>' + course.name + '</strong>' +
                    '<br />' +
                    '<small>' + course.members.join(', ') + '</small>' +
                '</div>' +                 
            '</div>';
        
        return this.generateGridNodeHTML(content, {course: course.id}, true);
    };

    this.findScheduleClashesByCourse = function(course) {
        var clashes = [];
        var candidates = this.findCoursesByWeekDayAndPeriod(course.weekDay, course.period);
    
        candidates.forEach(function(c) {
            var hasMemberOverlap = false;
    
            course.members.forEach(function(member) {
                if(c.members.includes(member)) {
                    hasMemberOverlap = true;
                }
            });
    
            if(hasMemberOverlap) {
                clashes.push(c);
            }
        });
    
        return clashes;
    };
    
    this.isLateNightCourse = function(course) {
        return course.period == 7;
    };

    this.isEarlyMorningCourse = function(course) {
        return course.period == 2;
    };

    this.getFirstWorkingDay = function() {
        return weekDays[0];
    };

    this.getLastWorkingDay = function() {
        return weekDays[weekDays.length - 1];
    };

    this.getFirstWorkingPeriod = function() {
        return periods[0].id;
    };

    this.getLastWorkingPeriod = function() {
        return periods[periods.length - 1].id;
    };

    this.isWorkingDay = function(weekDay) {
        var firstWorkingDay = this.getFirstWorkingDay().id;
        var lastWorkingDay = this.getLastWorkingDay().id;

        return weekDay >= firstWorkingDay && weekDay <= lastWorkingDay;
    };

    this.findWorkingImpedimentsByCourse = function(course) {
        var problems = [];
        var candidates = [];
        var nextDay = course.weekDay + 1;
        var previousDay = course.weekDay - 1;

        if(this.isEarlyMorningCourse(course) && this.isWorkingDay(previousDay)) {
            candidates = this.findCoursesByWeekDayAndPeriod(previousDay, this.getLastWorkingPeriod());

        } else if(this.isLateNightCourse(course) && this.isWorkingDay(nextDay)) {
            candidates = this.findCoursesByWeekDayAndPeriod(nextDay, this.getFirstWorkingPeriod());
        }
    
        candidates.forEach(function(c) {
            var hasMemberOverlap = false;
    
            course.members.forEach(function(member) {
                if(c.members.includes(member)) {
                    hasMemberOverlap = true;
                }
            });
    
            if(hasMemberOverlap) {
                problems.push(c);
            }
        });
    
        return problems;
    }

    this.highlightScheduleClashes = function(clashes) {
        if(!clashes || clashes.length == 0) {
            return;
        }

        clashes.forEach(function(course) {
            $('#course-node-' + course.id).addClass('clash');
        });
    };

    this.highlightWorkingImpediments = function(course, impediments) {
        if(!impediments || impediments.length == 0) {
            return;
        }

        impediments.forEach(function(course) {
            $('#course-node-' + course.id).addClass('impediment');
        });

        // highlight the offending course as well
        $('#course-node-' + course.id).addClass('impediment');
    };

    this.clearConstraintHighlights = function() {
        $('.course-node').each(function(i, el) {
            $(el).find('div.side').empty();
            $(el).removeClass('clash impediment');
        });
    };

    this.checkConstraintsByCourse = function(course) {
        var clashes = this.findScheduleClashesByCourse(course);
        var isSelfClash = clashes.length == 1 && clashes[0].id == course.id;
        var impediments = this.findWorkingImpedimentsByCourse(course);
    
        if(clashes.length > 0 && !isSelfClash) {
            this.highlightScheduleClashes(clashes);
        }
    
        if(impediments.length > 0) {
            this.highlightWorkingImpediments(course, impediments);
        }
    }
    
    this.findCoursesByWeekDayAndPeriod = function(weekDay, period) {
        var items = [];
    
        this.data.program.courses.forEach(function(course) {
            if(course.weekDay == weekDay && course.period == period)  {
                items.push(course);
            }
        });
    
        return items;
    }
    
    this.getCourseById = function(id) {
        var item = null;
    
        this.data.program.courses.forEach(function(course) {
            if(course.id == id) {
                item = course;
            }
        });
    
        return item;
    }
    
    this.getGroupById = function(id) {
        var item = null;
    
        this.data.program.groups.forEach(function(group) {
            if(group.id == id) {
                item = group;
            }
        });
    
        return item;
    }
    
    this.findCoursesByGroupId = function(groupId) {
        var items = [];
        
        this.data.program.courses.forEach(function(course) {
            if(course.group == groupId) {
                items.push(course);
            }
        });
    
        return items;
    }
    
    this.getNextCourseId = function() {
        var highest = 0;
    
        this.data.program.courses.forEach(function(course) {
            if(course.id > highest) {
                highest = course.id;
            }
        });
    
        return highest + 1;
    }
    
    this.getNextGroupId = function() {
        var highest = 0;
    
        this.data.program.groups.forEach(function(group) {
            if(group.id > highest) {
                highest = group.id;
            }
        });
    
        return highest + 1;
    }
    
    this.addOrUpdateCourse = function(courseObj) {
        console.log(courseObj);
        var isUpdate = courseObj.id;
        var group = this.getGroupById(courseObj.group);
    
        if(!group) {
            console.error('Provided course has invalid group. Course: ', courseObj);
        }
    
        if(!group.grid) {
            console.warn('Empty grid for group: ' + courseObj.group);
        }
    
        if(isUpdate) {
            // Update
            var course = this.getCourseById(courseObj.id);

            // TODO: improve this pile of crap
            for(var p in courseObj) {
                course[p] = courseObj[p];
            }

            console.log('Course updated: ', courseObj);
        } else {
            // Creating a new course
            courseObj.id = this.getNextCourseId();
            this.data.program.courses.push(courseObj);
            group.grid.add_widget(this.generateCourseGridNodeHTML(courseObj), 1, 1, 8, 2);
        
            console.log('Course added: ', courseObj);
        }

        this.commitCourse(course);
    }
    
    this.addOrUpdateGroup = function(groupObj) {
        var isUpdate = groupObj.id;

        if(isUpdate) {
            // Update
            var group = this.getGroupById(groupObj.id);

            // TODO: improve this pile of crap
            for(var p in groupObj) {
                group[p] = groupObj[p];
            }

            console.log('Group updated: ', groupObj);

        } else {
            // Creating a new group
            groupObj.id = this.getNextGroupId();
            groupObj.grid = this.createGroupBlock('groups-content', groupObj);

            this.data.program.groups.push(groupObj);
        
            console.log('Group added: ', groupObj);
        }

        this.commitGroup(group);
    }
    
    this.handleModalCourseSubmit = function() {
        var selectedMembers = [];
    
        $('#modal-course-members input:checked').each(function(i, el) {
            selectedMembers.push($(el).val());
        });
    
        var id = $('#modal-course-id').val();
        var name = $('#modal-course-name').val();
    
        this.addOrUpdateCourse({
            id: id,
            code: 'GCS011',
            name: name,
            group: this.active.groupId,
            weekDay: 7,
            period: 1,
            members: selectedMembers
        });
    
        $('#modal-course').modal('hide');
        this.active.groupId = undefined;
    }
    
    this.handleModalGroupSubmit = function() {
        var id = $('#modal-group-id').val();
        var name = $('#modal-group-name').val();
        
        this.addOrUpdateGroup({
            id: id,
            name: name
        });
    
        $('#modal-group').modal('hide');
    };

    this.findById = function(collection, id) {
        var item = null;

        if(!collection) {
            return null;
        }
        
        collection.forEach(function(i) {
            if(i.id == id) {
                item = i;
            }
        });

        return item;
    };
};

// TODO: move this to API endpoint
var weekDays = [
    {id: 2, name: "Segunda-feira"},
    {id: 3, name: "Terça-feira"},
    {id: 4, name: "Quarta-feira"},
    {id: 5, name: "Quinta-feira"},
    {id: 6, name: "Sexta-feira"},
    {id: 7, name: "Sábado"},
    {id: 8, name: "N/A"}
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

$(function () {
    var app = new Horarios.App();
    app.boot();

    // TODO: move this into App class.
    setInterval(function() {
        // TODO: call store.set('horarios.data', app.data);
    }, 2000);
});


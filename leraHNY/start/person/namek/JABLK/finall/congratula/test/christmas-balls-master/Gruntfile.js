module.exports = function(grunt) {

    "use strict";

    var watching = grunt.option('watching');
    var develop = grunt.option('develop');
    var tasks;
    var watch_files = [
        'src/**/*.js',
        'src/**/*.less',
        'Gruntfile.js'
    ];
    var time = new Date(), day = time.getDate(), month = time.getMonth()+1, year = time.getFullYear(), hour = time.getHours(), mins = time.getMinutes(), sec = time.getSeconds();
    var timestamp = (day < 10 ? "0"+day:day) + "/" + (month < 10 ? "0"+month:month) + "/" + (year) + " " + (hour<10?"0"+hour:hour) + ":" + (mins<10?"0"+mins:mins) + ":" + (sec<10?"0"+sec:sec);

    tasks = [
        'clear',
        'clean:lib',
        'eslint',
        'concat',
        'less',
        'postcss'
    ];

    tasks.push('uglify');

    if (!develop) {
        tasks.push('removelogging');
        tasks.push('remove_comments');
    }

    tasks.push('copy');

    if (watching) {
        tasks.push('watch');
    }

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copyright: '/*!\n' +
            ' * Christmas Balls - A Metro 4 Component v<%= pkg.version %> <%= pkg.version_suffix %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2020 <%= pkg.author %>\n' +
            ' * Built at '+timestamp+'\n' +
            ' * Licensed under <%= pkg.license %>\n' +
            ' !*/\n\n',

        clean: {
            lib: ['lib']
        },

        clear: {},

        eslint: {
            target: ['source/**/*.js'],
            rules: {
                "no-unused-vars": 1
            }
        },

        concat: {
            options: {
                banner: "<%= copyright %>",
                stripBanners: true,
                separator: "\n\n",
                process: function(src, filePath){
                    return '// Source: ' + filePath + '\n\n' + src;
                }
            },
            main: {
                src: ['src/christmas-balls.js'],
                dest: 'lib/js/christmas-balls.js'
            }
        },

        removelogging: {
            dist: {
                src: "lib/js/*.js",

                options: {
                    methods: ["log"]
                }
            }
        },

        remove_comments: {
            options: {
                keepSpecialComments: true,
                linein: false
            },
            lib: {
                src: 'lib/js/*.js'
            }
        },

        uglify: {
            options: {
                banner: "<%= copyright %>\n",
                comments: false,
                sourceMap: false,
                preserveComments: true,
                compress: true,
                mangle: false
            },
            core: {
                src: 'lib/js/christmas-balls.js',
                dest: 'lib/js/christmas-balls.min.js'
            }
        },

        less: {
            options: {
                paths: "src/",
                strictMath: false,
                sourceMap: false,
                banner: '<%= copyright %>',
                ieCompat: false,
                optimization: 2
            },
            src: {
                expand: true,
                cwd: "src/",
                src: [
                    "christmas-balls.less"
                ],
                ext: ".css",
                dest: "lib/css"
            }
        },

        postcss: {
            options: {
                map: false,
                processors: [
                    require('autoprefixer')(),
                    require('cssnano')()
                ]
            },
            dist: {
                src: 'lib/css/*.css'
            }
        },

        copy: {
            sounds: {
                expand: true,
                cwd: 'sounds',
                src: '**/*',
                dest: 'lib/sounds'
            },
            images: {
                expand: true,
                cwd: 'images',
                src: '**/*',
                dest: 'lib/images'
            }
        },

        watch: {
            scripts: {
                files: watch_files,
                tasks: tasks,
                options: {
                    spawn: false,
                    reload: true
                }
            }
        }
    });

    grunt.registerTask('default', tasks);

};
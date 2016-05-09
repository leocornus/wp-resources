/**
 * started with an empty class.
 */
;(function() {

    /**
     * set default wiki site to wikipedia.
     */
    var defaultSite = {
        'baseUrl' : 'en.wikipedia.org',
        'origin' : null,
        'apiPath' : '/w/api.php',

        /** 
         * the maximum number of items to return,
         * default wiki api number is 10, 500 is the max.
         */
        'limit' : 50,

        /**
         * default data-offset-top for the left nav panel in pixel.
         * This is for the bootstrap affix class.
         */
        'affixOffsetTop' : 300
    }

    /**
     * define the main WikiStrap class.
     */
    function WikiStrap(siteOptions) {

        this.siteOptions = 
               jQuery.extend({}, defaultSite, siteOptions);
        // save the default values.
        this._defaultSite = defaultSite;
    }

    /**
     * create the protocol here.
     */
    jQuery.extend(WikiStrap.prototype, {

        /**
         * the direct api call with wiki site.
         * 
         * @param {object} action the wiki api query action.
         * @param {function} callback call back function
         */
        apiGet: function(action, callback) {
            var self = this;

            // decide the origin for cross domain access.
            if(self.siteOptions.origin != null) {
                // origis is set, append to tha action.
                action = jQuery.extend(
                  {'origin': self.siteOptions.origin},
                  action
                );
            }

            /**
             * direct HTTP get method.
             */
            jQuery.get(self.getApiUrl(), action).
                done(function(data) {
                    // self.log(data);
                    callback(null, data);
                }).
                fail(function(data) {
                    // self.log(Error);
                    callback('Error', data);
                });
        },

        /**
         * return the full url to api.php.
         */
        getApiUrl: function() {

            var url = "//" +
                      this.siteOptions.baseUrl + 
                      this.siteOptions.apiPath;
            return url;
        },

        // return the max return limit.
        getLimit: function() {

            return this.siteOptions.limit;
        },

        /**
         * set the max return limit.
         */
        setLimit: function(limit) {

            this.siteOptions.limit = limit;
        },

        /**
         * get a wiki article.
         *
         * @param {string} title the page title, which should 
         *        be unique in a wiki site.
         */
        getArticle: function(title, callback) {

            // save the original this.
            var self = this;

            // get ready the data send to wiki api.php.
            var action = {
                'format' : 'json',
                'action' : 'parse',
                'page' : title,
                'prop' : 'text'
            };

            // call wiki api
            self.apiGet(action, function(err, data) {

                if(err) {
                    // got error.
                    callback(err);
                    return;
                }

                // get the page content html from response.
                var content = data.parse.text['*'];
                // process the content to match bootstrap.
                content = self.createArticleRow(title, content);
                callback(null, content);
            });
        },

        /**
         * return the the imageinfo for the give titles.
         */
        getImageinfo: function(titles, callback) {

            // get ready the data send to wiki api.php.
            var action = {
                'format' : 'json',
                'action' : 'query',
                'titles' : titles,
                'prop' : 'imageinfo',
                'iiprop' : 'url|mime',
                'iiurlheight' : 500
            };

            // call wiki api
            this.apiGet(action, function(err, data) {

                if(err) {
                    // got error.
                    callback(err);
                    return;
                }

                // get the pages.
                var pages = data.query.pages;
                // TODO: structure of the pages object.
                callback(null, pages);
            });
        },

        /**
         * return a list of images from the give category..
         * 
         */
        getImagesInCategory: function(category, viewType, callback) {

            var self = this;
            if(!category.match("^Category")) {
                // not start from Category
                category = 'Category: ' + category;
            }
            var action = {
                'format' : 'json',
                'action' : 'query',
                'list' : 'categorymembers',
                //'generator' : 'categorymembers',
                'cmtype' : 'file',
                'cmprop' : 'ids|title',
                'cmtitle' : category,
                'cmlimit' : this.getLimit()
            };

            this.apiGet(action, function(err, data) {
                // need get a list of page ids.
                if(err) {
                    callback(err);
                    return;
                }

                // images array
                var members = data.query.categorymembers;
                var titles = [];
                var ids = [];
                // preparing the image titles.
                jQuery.each(members, function(index, member) {
                    ids.push(member['pageid']);
                    titles.push(member['title']);
                });

                // get imageinfo and build the images rows.
                self.getImageinfo(titles.join('|'), 
                                  function(error, images) {
                    // create row for each image.
                    // the imageinfo api will not reserve the 
                    // sorting order, 
                    // so we pass ids from categorymembers to keep
                    // the sorting order.
                    switch(viewType) {
                    case 'lightbox':
                        $row = self.createImagesLightbox(ids,
                                                         images);
                        break;
                    case 'galleria':
                        $row = self.createImagesGalleria(ids,
                                                         images);
                        break;
                    case 'list':
                    default:
                        $row = self.createImagesRow(ids, images);
                        break;
                    }
                    callback(null, $row);
                });
            });
        },

        /**
         * create bootstrap row for wiki article content.
         */
        createArticleRow: function(title, content) {

            var self = this;

            var processed = this.processArticleContent(title, content);
            var contentHtml = processed['content'];
            var tocHtml = processed['toc'];
            var rowHtml = '<div class="row">' +
                '  <div class="col-md-9" id="content">' + 
                contentHtml + 
                '  </div>' + 
                '  <div class="col-md-3" id="navcol">' + 
                tocHtml +
                '  </div>' + 
                '</div>';

            // hook the resize event.
            jQuery(window).on('resize', function() {

                self.syncSidenavWidth();
            });

            var $row = jQuery(rowHtml);
            return $row;
        },

        /**
         * utility method to process the wiki article HTML
         */
        processArticleContent: function(title, content) {

            // parse the content html to a jQuery object.
            var $content = jQuery('<div>').html(content);
            // find the TOC div.
            var $toc = $content.find('div#toc>ul');
            //$toc.find('a').attr('data-toggle', 'pill');
            var liHtml = $toc.html();

            var navPanel = '<div class="panel panel-info' +
                '                sidebar-nav-fixed affix-top"' +
                '                id="navpanel"' + 
                '                style="margin-left: -15px">' + 
                '  <div class="panel-heading">' +
                '    <strong>' + title + '</strong>' + 
                '  </div>' +
                '  <div id="sidenav">' + 
                '    <ul class="nav nav-pills nav-stacked"' +
                '        style="max-height: 450px; ' + 
                '               overflow-y: auto">' +
                liHtml + 
                '    </ul>' +
                '  </div>' + 
                '</div>';

            //$toc.find('div#toctitle').replaceWith('');
            //alert(tocHtml);
            // convert the toc to bootstrap scroll spy.
            var $nav = jQuery('<nav class="affix" id="sidenav">').
                       html($toc.html());
            // add 
            $nav.find('ul').addClass('nav');
            // add class for the first ul.
            $nav.children('ul').addClass('nav-pills nav-stacked')
                .attr('data-spy', 'affix').attr('id', 'thenav');
            //$nav.find('a').attr('data-toggle', 'pill');
            // remove all class for li
            $nav.find('li').attr('class', '');
            var $toc = jQuery('<div>').html($nav);

            // adding the scroll styp for body:
            //var $body = jQuery('body');
            //$body.attr('data-spy', 'scroll').attr('data-target', '#sidenav');

            // remove TOC from content.
            $content.find('div#toc').replaceWith('');
            // remove the edit seciton for each heading.
            $content.find('span.mw-editsection').replaceWith('');
            var contentHtml = $content.html();
            // replace globaly! all occurrence!
            contentHtml = contentHtml.replace(/"\/wiki\//g, 
               '"//' + this.siteOptions.baseUrl + '/wiki/');

            var ret = {'toc' : navPanel, 
                       'content' : contentHtml};
            return ret; 
        },

        /**
         * utility method to set the outer width of target object to 
         * be the same with the source object.
         */
        syncSidenavWidth: function() {

            var $source = jQuery('#navcol');
            var $target = jQuery('#navpanel');
            $target.outerWidth($source.outerWidth());
            this.setAffixSpy();
        },

        /**
         * set the affix spy for nave panel.
         */
        setAffixSpy: function() {
            var $panel = jQuery('#navpanel');
            $panel.affix({
                offset: {
                    // in pixel.
                    top: this.siteOptions.affixOffsetTop
                }
            });
        },

        // toggle cursor
        toggleCursor: function(cursorStyle)  {
            jQuery('a').css('cursor', cursorStyle);
            jQuery('html,body').css('cursor', cursorStyle);
        },

        /**
         * return a list of page ids. or titles.
         */
        getPagesInCategory: function(category, callback) {

            var self = this;
            if(!category.match("^Category")) {
                // not start from Category
                category = 'Category: ' + category;
            }
            var action = {
                'format' : 'json',
                'action' : 'query',
                'list' : 'categorymembers',
                //'generator' : 'categorymembers',
                // return all types of member.
                'cmprop' : 'ids|title|type',
                'cmtitle' : category,
                'cmlimit' : this.getLimit()
            };

            this.apiGet(action, function(err, data) {
                // need get a list of page ids.
                if(err) {
                    callback(err);
                    return;
                }

                // pages array
                var pages = data.query.categorymembers;
                var $row = self.createCategoryRow(category, pages);
                callback(null, $row);
            });
        },

        /**
         * build the 2-col row for a category.
         */
        createCategoryRow: function(category, pages) {

            var self = this;
            var headingHtml = self.buildHeading(category);
            var searchBarHtml = self.buildSearchBar();
            var infoBarHtml = self.buildInfoBar(pages.length);
            // build the row html
            var rowHtml = '<div class="row">' +
                   '  <div class="col-md-4" id="navcol">' +
                   '    <div class="panel panel-info ' + 
                   '                sidebar-nav-fixed affix-top"' +
                   '         id="navpanel"' + 
                   '         style="margin-left: -15px">' + 
                   headingHtml +
                   searchBarHtml + 
                   '      <div id="sidenav"></div>' + 
                   infoBarHtml + 
                   '    </div>' + 
                   '  </div>' + 
                   '  <div class="col-md-8" id="content"></div>' +
                   '</div>';
            var $row = jQuery(rowHtml);
            // add the search event. keyboard down event.
            $row.find('input[id=searchInCategory]').
                 on('keyup', function(event) {

                // get the search term.
                var searchTerm = this.value;
                // toggle remove button for the input group
                self.toggleSearchRemoveButton(searchTerm, 
                                              jQuery(this).parent());
                self.filterNavPills(searchTerm);
            });


            // build the nav pills
            // adding the category content page to pages list
            pages.unshift({
                'ns' : 0,
                'pageid' : 0,
                'title' : category,
                'type' : 'category'
            });
            var $navPills = this.createNavPills(pages);
            $row.find('#sidenav').append($navPills);

            // hook the resize event.
            jQuery(window).on('resize', function() {

                self.syncSidenavWidth();
            });

            // load the category page as the default content.
            this.getArticle(category, function(err, $content) {
                // append to row.
                $row.find('#content').
                    append($content.find('#content').html());
            });

            return $row;
        },

        /**
         * get ready a nav nav-pills for the given pages array.
         * each page is an object with the following data structure:
         *
         * {
         *    'ns' : 0,
         *    'pageid' : 23458,
         *    'title' : 'Backups Sys Admin',
         *    'type' : 'page',
         * }
         */
        createNavPills: function(pages) {

            var self = this;
            var navPills = '<ul class="nav nav-pills nav-stacked"' +
                           '    style="max-height: 360px; ' + 
                           '           overflow-y: auto"' +
                           '></ul>';
            var $navPills = jQuery(navPills);
            //$navPills.attr('data-spy', 'affix');
            jQuery.each(pages, function(index, page) {

                var activeClass = 'class=""';
                if (index == 0) {
                    activeClass = 'class="active"';
                }

                var li = '<li ' + activeClass + '>' + 
                         '<a data-toggle="pill" href="#">' +
                         '<i class="fa fa-file-text-o"></i>' + ' ' +
                         '<span>' + page['title'] + 
                         '</span></a></li>';
                $navPills.append(li);
            });

            // add the click event.
            $navPills.find('li a').on('click', function() {

                // set the cursor to wait.
                self.toggleCursor('wait');
                var pageTitle = jQuery(this).find('span').text();
                self.getArticle(pageTitle, function(err, $content) {
                    jQuery('html, body').animate({
                       scrollTop: 0 
                    }, 300, function() {
                        jQuery('#content').html($content.find('#content').html());
                        self.toggleCursor('default');
                    });
                });
            });

            return $navPills;
        },

        /**
         * utility function to build the panel heading div.
         */
        buildHeading: function(category) {

            var divHtml = 
              '      <div class="panel-heading">' +
              '        <strong><a href="#">' + category + 
              //'          <i class="fa fa-refresh pull-right"></i>' + 
              '        </a></strong>' +
              '      </div>';

            return divHtml;
        },
        
        /**
         * utility function to build search bar for category panel.
         * the search bar will be hold in a panel-footer div.
         */
        buildSearchBar: function() {

            var divHtml = 
              '<div class="panel-footer">' + 
              '  <div class="input-group input-group-sm"' +
              '       role="group" aria-label="...">' + 
              '    <span class="input-group-addon bg-info"' +
              '          id="sizing-addon">' + 
              '      <i class="fa fa-search text-primary"></i>' +
              '    </span>' + 
              '    <input type="text" class="form-control"' + 
              '           placeholder="Find an article in category"' + 
              '           id="searchInCategory"' +
              '           aria-describedby="sizing-addon"/>' +
              '  </div>' + 
              '</div>';

            // TODO: Add the search function here.
            return divHtml;
        },

        /**
         * utility function to build the remove button for search
         * bar input as a input add on.
         */
        buildSearchBarRemove: function() {

            var removeHtml =
              '<span class="input-group-addon bg-info"' +
              '      id="search-remove">' + 
              '  <a href="#" id="cleanSearchTerm">' +
              '  <i class="fa fa-remove text-primary"></i>' +
              '  </a>' +
              '</span>';

            return removeHtml;
        },

        /**
         * filter the items on nav pills for the given search term.
         * this will highlight the matched term
         */
        filterNavPills: function(searchTerm) {

            var $navPills = jQuery('#sidenav');

            // clear all marks.
            $navPills.find('mark').replaceWith(function() {
                return jQuery(this).text();
            });

            if(searchTerm.length > 0) {
                // hide all items.
                jQuery.each($navPills.find('li'), 
                            function(index, item) {
                    var $item = jQuery(item);
                    if(! $item.hasClass('active')) {
                        // we will leave the active one as it is.
                        $item.attr('style', 'display: none');
                    }
                });

                // search the term.
                var selector = 'li:contains("' + searchTerm + 
                               '")';
                // display all matched items.
                jQuery.each($navPills.find(selector),
                            function(index, item) {
                    // the item will be a DOM element.
                    var $item = jQuery(item);
                    $item.attr('style', '');
                    // highlight mached terms.
                    var $title = $item.find('a span');
                    var newTitle = $title.text().
                        replace(searchTerm, 
                                '<mark>' + searchTerm + '</mark>');
                    $title.html(newTitle);
                });
            } else {
                // search term less than 1, 
                // we will show all articles.
                jQuery.each($navPills.find('li'), 
                            function(index, item) {
                    // remove styles by set to empty.
                    jQuery(item).attr('style', '');
                });
            }
        },

        /**
         * toggle remove icon for search input
         */
        toggleSearchRemoveButton: function(searchTerm, $inputGroup) {

            var self = this;

            var removeBtn = $inputGroup.find('span#search-remove');
            if(removeBtn.length > 0) {
                // remove button presents.
                if(searchTerm.length > 0) {
                    // do nothing.
                } else {
                    // remove the remove button.
                    removeBtn.remove();
                }
            } else {
                // no remove button.
                if(searchTerm.length > 0) {
                    // add the remove button.
                    removeBtn = this.buildSearchBarRemove();
                    $inputGroup.append(removeBtn);
                    // listen to the click event for remove button 
                    // of the search input field.
                    $inputGroup.find('a#cleanSearchTerm').
                         on('click', function(event) {

                        // find the search input field
                        $search = 
                          $inputGroup.find('input#searchInCategory');
                        // set value to nothing.
                        $search.val('');
                        // trigger keyup event.
                        $search.trigger('keyup');
                    });

                } else {
                    // do nothing...
                }
            }
        },

        /**
         * utility function to build info bar for category panel.
         * the info bar will be hold in a panel-footer div.
         */
        buildInfoBar: function(total) {

            var divHtml = 
              '<div class="panel-footer">' + 
              '  <div class="text-right">' +
              '    <span class="label label-success">' +
              '      <span id="infoSummary">Found ' + total + 
              '      Articles</span>' +
              '    </span>' + 
              '    <a href="#"><span class="label label-warning">' +
              '      <i class="fa fa-chevron-left"></i>' +
              '    </span></a>' + 
              '    <a href="#"><span class="label label-warning">' +
              '      <i class="fa fa-chevron-right"></i>' +
              '    </span></a>' + 
              '  </div>' + 
              '</div>';

            // TODO: Add the pagination function here.
            return divHtml;
        },

        /**
         * create a 2-col row for each image.
         * one column for the thumb nail image and
         * another column for the description of the image.
         */
        createImagesRow: function(ids, images) {

            var self = this;

            var rows = [];
            var index = 0;
            jQuery.each(ids, function(index, pageId) {

                var page = images[pageId];
                // get the image url.
                var imageUrl = page['imageinfo'][0]['thumburl'];
                // the image column.
                var imageCol =
                    '<div class="col-md-8">' +
                    '  <div class="thumbnail">' +
                    '  <img style="height: 500px"' +
                    '       src="' + imageUrl + '"' +
                    '       id="pageid-' + page['pageid'] + '"' +
                    '       pageTitle="' + page['title'] + '"' +
                    '  >' +
                    '  </div>' +
                    '</div>';
                // the image description column
                var descCol =
                    '<div class="col-md-4"' +
                    '     id="image-desc-' + page['pageid'] + '"' +
                    '     style="max-height: 500px; ' +
                    '            overflow-y: auto"' +
                    '>' +
                    '</div>';

                // starts from the order: image and desc
                var cols = imageCol + descCol;
                if (index % 2 == 1) {
                    // switch to: desc and image.
                    cols = descCol + imageCol;
                }

                var aRow = '<div class="row">' + cols + '</div>';
                rows.push(aRow);
                index = index + 1;
            });

            //console.log(rows);
            var $row = jQuery(rows.join(' '));

            // hook the load event.
            $row.find('img[id^=pageid-]').on('load', function(event) {
                // page id.
                var pageId = this.id
                //console.log(this.id);
                var pageTitle = jQuery(this).attr('pageTitle');
                //console.log(pageTitle);
                var descId = pageId.replace('pageid', 'image-desc');
                //console.log(descId);
                self.getArticle(pageTitle, function(err, $content) {
                    $row.find('#' + descId).
                        html($content.find('#content').html());
                });
            });

            //console.log($row);
            return $row;
        },

        /**
         * create photo album for the images by using lightbox2.
         */
        createImagesLightbox: function(ids, images) {

            var self = this;

            var boxies = [];
            jQuery.each(ids, function(index, pageId) {

                var page = images[pageId];
                var thumbUrl = page['imageinfo'][0]['thumburl'];
                var imageUrl = page['imageinfo'][0]['url'];
                var imageTitle = page['title'];
                // one box for each image.
                var box = 
                  '<a class="example-image-link"' +
                  '   href="' + imageUrl + '"' +
                  '   data-lightbox="example-set"' +
                  '   data-title="' + imageTitle + '"' + 
                  '>' +
                  '  <img class="example-image"' +
                  '       src="' + thumbUrl + '"' +
                  '       alt="' + imageTitle + '"/>' +
                  '</a>';
                boxies.push(box);
            });

            var $boxies = jQuery('<div class="image-row">' + 
                                 boxies.join(' ') +
                                 '</div>');
            return $boxies;
        },

        /**
         * create photo album for the images by using Galleria.
         */
        createImagesGalleria: function(ids, images) {

            var self = this;

            var boxies = [];
            jQuery.each(ids, function(index, pageId) {

                var page = images[pageId];
                var thumbUrl = page['imageinfo'][0]['thumburl'];
                var imageUrl = page['imageinfo'][0]['url'];
                var imageTitle = page['title'];
                // one box for each image.
                var box =
                  '<a href="' + imageUrl + '">' +
                  '<img class="example-image"' +
                  '     src="' + thumbUrl + '"' +
                  '     alt="' + imageTitle + '"/>' +
                  '</a>';
                boxies.push(box);
            });

            var $boxies = jQuery('<div class="galleria">' +
                                 boxies.join(' ') +
                                 '</div>');
            return $boxies;
        }
    });

    // export to window
    window.WikiStrap = WikiStrap;
}());

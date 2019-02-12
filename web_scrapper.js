const rp = require('request-promise');
const cheerio = require('cheerio');

const fs = require('fs');
const request = require('request');
var Q = require('q');

const options = {
  uri: `https://farm-r.com/s?category=all`,
  transform: function (body) {
    return cheerio.load(body);
  }
};

var cat_list = [];

//@TODO: Need to do better exception handing here...
function do_web_scrapping(scrape_callback) {

  cat_list = [];
    
    // Do the scrapping on if the no listing.json file exists
    rp(options)
    .then(($) => {

        //Getting categories and sub-categories
        var catElem = $('#home-toolbar-categories-menu a');

        var categories = [];
        var sub_categories = [];

        var cat_name = '';
        var catIndex = 0;
        var subCatIndex = 0;

        catElem.each(function() {

        var curText = $(this).text().trim();
        var curLink = $(this).attr('href'); 

        if(curText !== 'All categories') {

            if(! $(this).hasClass('toggle-menu-subitem')) {

                //We reach here if the current element is main category

                subCatIndex = 0;
                cat_name = curText;

                cur_cat_obj = {
                    'name': cat_name,
                    'id': catIndex,
                    'link': curLink,
                    'sub_categories': []
                }

                cat_list.push(cur_cat_obj);

                catIndex += 1;

            } else {

                //We reach here if the current element is sub category

                var subCatObj = {
                'name': curText,
                'id': subCatIndex,
                'link': curLink,
                'listings': []
                }

                cat_list[catIndex - 1]['sub_categories'].push(subCatObj);

                subCatIndex += 1;
            }
        }
        
        });

        //Get the posts of individual subcategories
        get_listing_data(scrape_callback);

    })
    .catch((err) => {
        console.log(err);
    });
}


var promisesList = [];

function get_listing_data(scrape_callback) {

    cat_list.forEach(function(cat) {

        var cat_name = cat['name'];
        var cat_id = cat['id'];

        var sub_cats = cat['sub_categories'];

        sub_cats.forEach(function(subcat) {

            //we use deferred object so we can know when the request is done
            var deferred = Q.defer();

            var subcat_id = subcat['id'];
            var curLink = "https://farm-r.com" + subcat['link'];    

            //create a new result object and add it to results
            var result = {
                url: curLink,
                cat_name: cat_name,
                subcat_id: subcat_id,
            };

            //perform the request
            request(curLink, function (error, response, body) {
                if (!error) {
                    var $ = cheerio.load(body);
                    
                    cat_list[cat_id]['sub_categories'][subcat_id]['listings'] = get_listings_data($);

                    //resolve the promise so we know this request is done.
                    //  no one is using the resolve, but if they were they would get the result of share
                    deferred.resolve(result);


                } else {

                    //request failed, reject the promise to abort the chain and fall into the "catch" block
                    deferred.reject(error);
                    console.log("We've encountered an error: " + error);
                    
                }
            });

            promisesList.push(deferred.promise);

        });
    });

    //results.map, converts the "array" to just promises
    //Q.all takes in an array of promises
    //when they are all done it rull call your then/catch block.
    return Q.all(promisesList)
    .then(sendResponse) //when all promises are done it calls this
    .catch(sendError);  //if any promise fails it calls this

    function sendError(error){
     res.status(500).json({failed: error});
    }

    function sendResponse(data) { 
        console.log('All links fetched...');

        var metaData = {
            'content': cat_list
        }

        var metaDataS = JSON.stringify(metaData);


        //Save the scrapped content to a JSON file
        //if (! fs.existsSync('/listing.json')) {
        //    // Clear the content and update new file
        //}

        

        fs.writeFile('listing.json', metaDataS, 'utf8', function(message) {
            console.log('Data stored in JSON file');

            //Extract content
            if(scrape_callback) {
              scrape_callback();  
            } else {
                console.log('No callback provided so this is from cron job');
            }
        });

    }           
}

function get_listings_data($) {

    var listings = [];

    var elem = $('.home-fluid-thumbnail-grid .home-fluid-thumbnail-grid-item');
    
    elem.each(function() {
        
        var link = $(this).find('.fluid-thumbnail-grid-image-item-link').attr('href');
        var title = $(this).find('.fluid-thumbnail-grid-image-title').text().trim();
        var imageURL =  $(this).find('.fluid-thumbnail-grid-image-image').attr('src');
        var priceVal =  $(this).find('.fluid-thumbnail-grid-image-price').text().trim();
        var priceQuantity =  $(this).find('.fluid-thumbnail-grid-image-quantity').text().trim();
        var price = priceVal + ' ' + priceQuantity;
        
        
        var curListingObj = {
            'title': title ? title : ' ',
            'link': link ? link : ' ',
            'price': price ? price : ' ',
            'imageURL': imageURL ? imageURL : ' ' 
        }

        listings.push(curListingObj);

        if(listings.length == 10) {
            // we only need top 10 elements in the list to be displayed on the bot
            // This breaks the each loop
            return false; 
        }
    });

    return listings;
}


module.exports = {
  'do_web_scrapping': do_web_scrapping
}




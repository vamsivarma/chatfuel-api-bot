const fs = require('fs');

const web_scrapper = require('./web_scrapper');

var categories = [];
var sub_categories = [];
var post_listings = [];
var formattedMeta = {};
var call_back = '';

function get_meta_data(data_callback_func) {

    call_back = data_callback_func;

    if (fs.existsSync('listing.json')) {
        //Data already exists, so fetch it directly
        format_scrapped_data();
    } else {
        //Data is not present so do web scrapping
        web_scrapper.do_web_scrapping(format_scrapped_data);
    }

    //watch for listing.json file changes
    update_api_results();
}

function update_api_results() {

    fs.watchFile('listing.json', (curr, prev) => {

        console.log("Scarapped content stored in the file");

        //Check if there is already data in the model
        if(categories.length) {
            format_scrapped_data(true);
        }

    }); 
}
 

function format_scrapped_data(persistFlag) {

    fs.readFile('listing.json', 'utf8', function readFileCallback(err, data) {
        if (err){
            console.log(err);
        } else {
            var meta_obj = JSON.parse(data); //now it an object

            var meta_data = meta_obj['content'];

            extract_categories(meta_data);
            extract_subcategories(meta_data);
            extract_listings(meta_data);

            formattedMeta = {
                "categories": categories,
                "sub_categories": sub_categories,
                "post_listings": post_listings
            }

        }
    });

    if(persistFlag === undefined) {
        call_back(formattedMeta);
    } 
}

function extract_categories(meta) {

    categories = [];

    categories = meta.map(cat => {
        return {
            "title": cat.name,
            "url": "https://farm-r-bot.herokuapp.com/getsubcategories?cat_id=" + cat.id,
            "type":"json_plugin_url"
          }
    });

}

function extract_subcategories(meta) {
    
    sub_categories = [];

    sub_categories = meta.map(cat => {

        const cur_subcategories = cat['sub_categories'].map(subcat=> {
            return {
                "title": subcat.name,
                "url": "https://farm-r-bot.herokuapp.com/getlisting?cat_id=" + cat.id + "&subcat_id=" + subcat.id,
                "type":"json_plugin_url"
              }
        });

        return {
            "cat_id": cat.id,
            "sub_categories": cur_subcategories
        }
    });

}

function extract_listings(meta) {

    post_listings = [];

    post_listings  = meta.map(cat => {

        const cur_subcategories = cat['sub_categories'].map(subcat=> {

            cur_listings = subcat['listings'].map(listObj=> {

                return {
                    "title": listObj.title,
                    "image_url": "https://farm-r.com" + listObj.imageURL,
                    "subtitle": listObj.price,
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": "https://farm-r.com" + listObj.link,
                            "title": "More Details"
                        }, {
                            "type": "phone_number",
                            "phone_number": "+441665252055",
                            "title": "Call Farm-r"
                        }, {
                            "type": "element_share"
                        }
                    ]
                }

            });


            return {
                "sub_cat_id": subcat.id,
                "listings": cur_listings
              }
        });

        return {
            "cat_id": cat.id,
            "sub_categories": cur_subcategories
          }
    });
}


function getCategories() {
    return categories;
}

function getSubCategories() {
    return sub_categories;
}

function getPostListings() {
    return post_listings;
}

module.exports = {
    'get_meta_data': get_meta_data,
    'getCategories': getCategories,
    'getSubCategories': getSubCategories,
    'getPostListings': getPostListings
}
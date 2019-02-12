var categories = [];
var subcategories = [];
var post_listings = [];

const bot_model = require('./bot_model');
const web_scrapper = require('./web_scrapper');

var server_obj = '';
var force_scrape_res = '';

function load_apis(server) {

    server_obj = server;

    //Verify if the content already exists otherwise do on demand webscrapping
    var metadata = bot_model.get_meta_data(data_callback);
}

function data_callback() {
    add_endpoints(server_obj);
}

function add_endpoints(server) {

    server.get('/getcategories', function (req, res) {

        var categories = bot_model.getCategories();

        responseToSend = {
            "messages": [
                {
                "text":  "What do you need?",
                "quick_replies": categories
                }
            ]
        };
    
        return res.json(responseToSend);
    
    });
    
    server.get('/getsubcategories', function (req, res) {
    
        const cat_id = Number(req.query.cat_id);
        var subcategories = bot_model.getSubCategories();
    
        responseToSend = {
            "messages": [
                {
                "text":  "There are various options. Please choose a category below. ",
                "quick_replies": subcategories[cat_id]['sub_categories'].slice(0, 10)
                }
            ]
        };
    
        return res.json(responseToSend);
    
    });

    server.get('/getlisting', function (req, res) {
    
        const cat_id = Number(req.query.cat_id);
        const subcat_id = Number(req.query.subcat_id);
        var post_listings = bot_model.getPostListings();
        const cur_listing = post_listings[cat_id]['sub_categories'][subcat_id]['listings'];
    
        responseToSend = {
            "messages": [
                {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "image_aspect_ratio": "square",
                            "elements": cur_listing.slice(0, 10)
                        }
                    }
                }
            ]
        };
        
        return res.json(responseToSend);
    
    });

    server.get('/force_scrape', function (req, res) {
        force_scrape_res = res;
        web_scrapper.do_web_scrapping(force_scrape_callback);
    });
}

function force_scrape_callback() {
    
    responseToSend = {
        "status_code": 200,
        "message": "Data scrapped successfully"
    };
    
    return force_scrape_res.json(responseToSend);

}



module.exports = {
    'load_apis': load_apis
}
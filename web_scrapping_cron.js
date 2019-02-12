var web_scrapper = require('./web_scrapper.js')

var CronJob = require('cron').CronJob;

//'0 */45 * * * *' - Every 45 minutes
// '00 00 00 * * *' - at 00:00:00 AM
// For every minute - 0 */1 * * * *
// For every 3 hours - 0 0 */3 * * *

var scrapping_cron_job = new CronJob('0 0 */1 * * *', function() {
  
  /*
   * Runs every 3 hours - scrapes the latest content and stores in the json file 
   */
   web_scrapper.do_web_scrapping();

   // DO SOMETHING
  }, function () {
      /* This function is executed when the job stops */
      console.log('Web scrapping done through cron');
  },
  true /* Start the job right now */
);

module.exports = {
  'scrapping_cron_job': scrapping_cron_job
}
export const LOGS_CHANGE_CURRENCY = 'middleware/logs/LOGS_CHANGE_CURRENCY'
export const LOGS_ADD_ITEM = 'middleware/logs/LOGS_ADD_ITEM'
/*
change currency from ${currency} to ${currency2}
add ${item-title} to the backet
remove ${item-title} from the basket
navigate to ${url} page
sort by ${title}
time of action in utc forma (+newData())
*/

const toServer = (text) => {
       fetch('/api/v1/logs', {
              method: 'POST',
              headers: {
                'Content-Type' : 'application/json'
              },
              body: JSON.stringify({
                text
              })
            })
              .then((res) => {
                return res.json()
              })
              .then((result) => {
                console.log(result)
              })
               .catch((err) => {
                console.log(err)
               })
    }
const  logs = () => {
  return () => (next) => (action) => {
        switch(action.type) {
          case LOGS_CHANGE_CURRENCY : {
            toServer(`change currency from ${action.payload.lastcurrency} to ${action.payload.newCurrency}`)
            break
          }
          case LOGS_ADD_ITEM : {
            toServer(`add ${action.payload.itemTitle} to the backet`)
            break
          }
          default:
            return next(action)
        }
        return next(action)
      }
    }
export default logs()
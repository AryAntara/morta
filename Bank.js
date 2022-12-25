import fs from "fs"
import {table} from "table"

function ReadQuery(path){
  let rawQuery = fs.readFileSync(path,'utf8')
  let commentStart = rawQuery.indexOf('{') 
  let commentStop = rawQuery.indexOf('}')
  let comment = rawQuery.slice(commentStart,commentStop)
  rawQuery = rawQuery.replaceAll(comment,'')
  return rawQuery.replaceAll("\n"," ")
}

const queries = ["NEW","ASSIGN","FIELDS","CREATE","INSERT","WITH","ON"]

function queryParser(rawQuery){
  let arrayOfRawQuery = rawQuery.split(" ")
  arrayOfRawQuery.forEach((data,index) => {
    if(isQuery(data)){
      
      if(data == "NEW"){
        currentStorage = arrayOfRawQuery[++index]
      }
      
      if(data == "ASSIGN" && arrayOfRawQuery[++index] == "FIELDS"){
        let fields = arrayOfRawQuery[index+1].split(',')
        ephemeralFields = [...fields]
      }
      
      if(data == "CREATE"){
        if(currentStorage){
          storage[currentStorage] = []
        }
      }
      
      if(data == "INSERT" && arrayOfRawQuery[index+1] == "WITH"){
        let storageLocal = arrayOfRawQuery[index++]
        let values = arrayOfRawQuery[index+1].split(",")
        let keyValueEphemeral = {}
        ephemeralFields.forEach((field,index) =>{
           keyValueEphemeral[field] = values[index].replaceAll('_',' ')
        })
        storage[currentStorage].push(keyValueEphemeral)
        currentIndex = storage[currentStorage].length - 1
      }
      
      if(data == "ON"){
        storage[currentStorage][currentIndex]["__assign_on"] = arrayOfRawQuery[index+1]
      }
      
      if(data == "DONE"){
        currentIndex = 0
        currentStorage = ""
        ephemeralFields = []
      }
     
    }
  })
}

function isQuery(word){
  return queries.includes(word)
}

const storage = {}
let currentStorage = ""
let ephemeralFields = []
let currentIndex = 0

class Bank {
  constructor(path){
    queryParser(ReadQuery(path))
    this.data = storage
  }

  showData(storageName){
    let total = 0
    let totalPemasukan = 0
    let totalPengeluaran = 0
    const items = this.data[storageName].map((row,index) => { 
      let localTotal = Math.floor(parseInt(row.plus) - parseInt(row.minus))
      totalPemasukan += parseInt(row.plus) 
      totalPengeluaran += parseInt(row.minus)
      
      total += localTotal
      return [
        index+1,
        rupiah(parseInt(row.plus)),
        rupiah(parseInt(row.minus)),
        rupiah(localTotal),
        row.__assign_o ? row.__assign_on : '-',
        row.keterangan
      ]
    })
    let data = [
      ['No','Pemasukan','Pengeluaran','Total','Date','Keterangan'],
      ...items 
    ]
    
    const totalMoney = ['Total',rupiah(totalPemasukan),rupiah(totalPengeluaran),rupiah(total),'My Money',rupiah(total)]
    data = [...data, totalMoney]
    console.clear()
    console.log(table(data))
  }
}

function rupiah(num){
  return num.toLocaleString('en-US',{
    style: 'currency',
    currency: 'IDR'
  })
}

export default Bank 
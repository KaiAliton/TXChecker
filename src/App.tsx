import './App.css'
import updateSheet from "./tools/index.ts";
import * as XLSX from 'xlsx';
import {useState} from "react";
import { json2csv } from 'json-2-csv';

function App() {
    const [items, setItems] = useState<[]>(localStorage.getItem('items') ? JSON.parse(localStorage.getItem('items')) : [])
    const [itemsInput, setItemsInput] = useState<string>('');
    const [collection, setCollection] = useState<string>(localStorage.getItem('collection') ? localStorage.getItem('collection') : '');
    const [startBlock, setStartBlock] = useState<number>(localStorage.getItem('start') ? parseInt(localStorage.getItem('start')) : 0);
    const [endBlock, setEndBlock] = useState<number>(localStorage.getItem('end') ? parseInt(localStorage.getItem('end')) : 0);
    const [result, setResult] = useState<[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTransaction, setCurrentTransaction] = useState(null)

    function handleAddItem ()  {
        if (itemsInput.length > 0) {
            const item = parseInt(itemsInput);
            setItems((prevItems) => {
                return [...prevItems, item];
            });
            const storedItems = JSON.parse(localStorage.getItem('items')) || [];
            storedItems.push(item);
            localStorage.setItem('items', JSON.stringify(storedItems));
            setItemsInput('');
        }
    }

    function handleItemsChanged (event) {
        const value = event.target.value;
        if (/^[1-9]\d*$/.test(value) || value === '') {
            setItemsInput(value);
        }
    }

    function handleRemoveItem(index: number){
        setItems((prevItems) => {
            return prevItems.filter((_, i) => i !== index);
        });
        const storedItems = JSON.parse(localStorage.getItem('items')) || [];
        storedItems.splice(index, 1);
        localStorage.setItem('items', JSON.stringify(storedItems));
    };

    function handleCollectionChange(event){
        const value = event.target.value;

        // Проверяем, что введенное значение начинается с "0x" и имеет правильную длину
        if (/^0x[0-9a-fA-F]{40}$/.test(value) || value === '') {
            setCollection(value);
            localStorage.setItem('collection', value);
        }
    };

    function handleStartBlockChange(event){
        const value = event.target.value;
        if (/^[1-9]\d*$/.test(value) || value === '') {
            setStartBlock(parseInt(value));
            localStorage.setItem('start', value);
        }
    }

    function handleEndBlockChange(event){
        const value = event.target.value;
        if (/^[1-9]\d*$/.test(value) || value === '') {
            setEndBlock(parseInt(value));
            localStorage.setItem('end', value)
        }
    }

  function showMore (transaction)
    {
        window.my_modal_1.close()
        setCurrentTransaction(transaction);
        window.my_modal_1.showModal()
    }


    async function getData() {
        console.log(
            {
                "coll": collection.length,
                "items": items.length,
                "start": startBlock,
                "end": endBlock
            }
        )
        if (collection.length >= 40 ||  items.length > 0 || startBlock > 0 || endBlock > 0) {
            setIsLoading(true)
            setResult(await updateSheet(collection, items, startBlock, endBlock))
            setIsLoading(false)
        } else {
            console.error('Something went wrong, check your inputs...')
        }
        console.log(result)
    }

    async function downloadCSV() {
        const newResult = result.map(({tx, ...rest}) => {
            return rest;
        })
        const csv = await json2csv(newResult)
        downloadBlob(csv, 'export.csv', 'text/csv;charset=utf-8;')
    }

    async function downloadXLSX() {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(result);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, collection + '.xlsx'  || "output.xlsx");
    }

    function downloadBlob(content: string, filename: string, contentType: string) {
        const blob = new Blob([content], {type: contentType});
        const url = URL.createObjectURL(blob);
        const pom = document.createElement('a');
        pom.href = url;
        pom.setAttribute('download', filename);
        pom.click();
    }

    return (
        <div className={'w-full h-full flex items-center flex-col'}>
            <div className={'w-3/4 flex flex-col'}>
                <div className={'w-full flex justify-center my-5'}>
                    <span className={'text-3xl'}>TX Checker</span>
                </div>
                <div className={'flex flex-row justify-center gap-5 max-h-64'}>
                    <div className={'bg-neutral rounded-xl p-2 w-3/4'}>
                        <div className={'form-control'}>
                            <label className={'label'}>
                                <span>Collection Address</span>
                            </label>
                            <input type="text" className={'input input-bordered w-full'} value={collection}
                                   onChange={handleCollectionChange}/>
                        </div>
                        <div className={'form-control'}>
                            <label className={'label'}>
                                <span>Item Ids</span>
                            </label>
                            <div className={'flex max-h-12'}>
                                <div className={'join w-1/2'}>
                                    <input type="number" className={'input input-bordered join-item w-3/4'}
                                           onChange={handleItemsChanged} value={itemsInput}/>
                                    <button className={'btn join-item'} onClick={handleAddItem}>+</button>
                                </div>
                                <div className={'auto-cols-auto overflow-x-auto max-h-full w-1/2'}>
                                    {
                                        items?.map((item, index) => {
                                            return (
                                                <button key={index} className={'btn btn-xs mx-2'}
                                                        onClick={() => handleRemoveItem(index)}>{item}</button>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={'bg-neutral rounded-xl p-2 w-1/3'}>
                        <div className={'form-control'}>
                            <label className={'label'}>
                                <span>Start Block</span>
                            </label>
                            <input type="text" className={'input input-bordered w-full'} value={startBlock}
                                   onChange={handleStartBlockChange}/>
                        </div>
                        <div className={'form-control'}>
                            <label className={'label'}>
                                <span>End Block</span>
                            </label>
                            <input type="text" className={'input input-bordered w-full '} value={endBlock}
                                   onChange={handleEndBlockChange} />
                        </div>
                    </div>
                </div>
                <div className={'w-full flex justify-center my-5 gap-2'}>
                    <button className={`btn btn-secondary w-2/3 ${isLoading ? 'btn-disabled': ''}`} onClick={getData}>Find {isLoading ? (
                        <span className="loading loading-spinner"></span>) : null}</button>
                    <button className={`btn btn-secondary ${result.length > 0 ? '' : 'btn-disabled'}`}
                            onClick={downloadCSV}>Download CSV
                    </button>
                    <button className={`btn btn-secondary ${result.length > 0 ? '' : 'btn-disabled'}`}
                            onClick={downloadXLSX}>Download XLSX
                    </button>
                </div>
                <div>
                    <span>Results: {result.length}</span>
                </div>
                <div className={'overflow-x-auto h-full'}>
                    <table className={'table table-pin-rows'}>
                        <thead>
                        <tr>
                            <th>id</th>
                            <th>type</th>
                            <th>through</th>
                            <th>value</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            result?.map((item, index) => (
                                <tr key={index}>
                                    <th>{item.id}</th>
                                    <th>{item.type}</th>
                                    <th>{item.marketPlace}</th>
                                    <th>{item.value}</th>
                                    <th>
                                        <button className="btn" onClick={() => showMore(item)}>More
                                        </button>
                                    </th>
                                </tr>
                            ))
                        }
                        </tbody>
                    </table>
                </div>
                <dialog id="my_modal_1" className="modal">
                    <form method="dialog" className="modal-box w-11/12 max-w-5xl">
                        <h3 className="text-lg font-bold w-full truncate">Transaction: <a href={`https://etherscan.io/tx/${currentTransaction?.txHash}`} className={'link-primary truncate'}>{currentTransaction?.txHash}</a></h3>
                        <h3 className="text-lg font-bold w-full truncate">From: <a href={`https://etherscan.io/address/${currentTransaction?.from}`} className={'link-primary'}>{currentTransaction?.from}</a></h3>
                        <h3 className="text-lg font-bold w-full truncate">To: <a href={`https://etherscan.io/address/${currentTransaction?.to}`} className={'link-primary'}>{currentTransaction?.to}</a></h3>
                        <h3 className="text-lg font-bold w-full truncate">TX: {currentTransaction?.tx.blockNumber}</h3>

                        <div className="modal-action">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn">Close</button>
                        </div>
                    </form>
                </dialog>
            </div>
        </div>
    )
}

export default App

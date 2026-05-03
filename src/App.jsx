import React, { useState, useRef, useEffect } from "react";
import { Apple, Trash2, Download, Printer } from "lucide-react";

const App = () => {
    const invoiceRef = useRef(null);
    const [libLoaded, setLibLoaded] = useState(false);

    // Load html2canvas dynamically since it's not available in the local environment
    useEffect(() => {
        const script = document.createElement("script");
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.async = true;
        script.onload = () => setLibLoaded(true);
        document.body.appendChild(script);
        return () => {
            const existingScript = document.querySelector(
                `script[src="${script.src}"]`
            );
            if (existingScript) document.body.removeChild(existingScript);
        };
    }, []);

    // --- STATE ---
    const [invoiceTo, setInvoiceTo] = useState("SKIN X (MYANMAR)");
    const [invoiceNumber, setInvoiceNumber] = useState("#007");
    const [totalTitle, setTotalTitle] = useState("ကျန်ရှိငွေ");

    const formatDate = (date) => {
        const options = { day: "2-digit", month: "long", year: "numeric" };
        return date.toLocaleDateString("en-GB", options).toUpperCase();
    };

    const [invoiceDate, setInvoiceDate] = useState(formatDate(new Date()));
    const [dueDate, setDueDate] = useState(formatDate(new Date()));

    const [rows, setRows] = useState([
        {
            id: 1,
            task: "Apple အတွက် အနုပညာ ကြေးပေးရန် စုစုပေါင်း",
            subtotal: "700000"
        },
        { id: 2, task: "လက်ခံရရှိထား သောငွေ စုစုပေါင်း", subtotal: "350000" },
        { id: 3, task: "", subtotal: "" }
    ]);

    const [paymentInfo, setPaymentInfo] = useState({
        accountName: "Ei Hnin Ye Aung",
        kpayNumber: "09-777776849"
    });

    const [manualTotal, setManualTotal] = useState(null);

    // --- LOGIC ---
    const handleInputChange = (id, field, value) => {
        const updatedRows = rows.map((row) => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        });

        setRows(updatedRows);

        const lastRow = updatedRows[updatedRows.length - 1];
        if (lastRow.task !== "" || lastRow.subtotal !== "") {
            setRows([
                ...updatedRows,
                { id: Date.now(), task: "", subtotal: "" }
            ]);
        }
    };

    const deleteRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const calculateTotal = () => {
        const values = rows
            .map((r) => parseFloat(r.subtotal))
            .filter((v) => !isNaN(v));

        if (values.length === 0) return 0;
        if (values.length === 1) return values[0];

        return values[0] - values.slice(1).reduce((acc, curr) => acc + curr, 0);
    };

    const displayTotal =
        manualTotal !== null ? manualTotal : calculateTotal().toLocaleString();

    const downloadInvoice = async () => {
        if (!invoiceRef.current || !window.html2canvas) return;

        const element = invoiceRef.current;
        const actionsBar = document.querySelector(".actions-bar");
        const deleteButtons = document.querySelectorAll(".delete-btn");

        // Find rows with empty tasks to hide them
        const tableRows = element.querySelectorAll(".table-row");
        const hiddenRows = [];

        tableRows.forEach((row) => {
            const textarea = row.querySelector(".editable-textarea");
            if (textarea && textarea.value.trim() === "") {
                hiddenRows.push(row);
                row.style.display = "none"; // Temporarily hide empty rows
            }
        });

        // Save original styles
        const originalWidth = element.style.width;
        const originalMaxWidth = element.style.maxWidth;
        const originalPosition = element.style.position;

        // Force A4 width and reset clipping during capture
        element.style.width = "800px";
        element.style.maxWidth = "none";
        if (actionsBar) actionsBar.style.display = "none";
        deleteButtons.forEach((btn) => (btn.style.visibility = "hidden"));

        try {
            // Small timeout to allow browser to re-render for the fixed width
            await new Promise((resolve) => setTimeout(resolve, 150));

            const canvas = await window.html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: 800,
                windowWidth: 800,
                onclone: (clonedDoc) => {
                    const clonedElement =
                        clonedDoc.querySelector(".invoice-paper");
                    if (clonedElement) {
                        clonedElement.style.width = "800px";
                        clonedElement.style.padding = "64px";
                    }
                    // Double check in clone that empty rows are gone
                    clonedDoc.querySelectorAll(".table-row").forEach((row) => {
                        const txt = row.querySelector(".editable-textarea");
                        if (txt && txt.value.trim() === "") {
                            row.style.display = "none";
                        }
                    });
                }
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;

            // Filename as Date and ID combination
            const cleanId = invoiceNumber.replace(/[^a-z0-9]/gi, "_");
            const cleanDate = invoiceDate.replace(/ /g, "_");
            link.download = `${cleanId}_${cleanDate}.png`;

            link.click();
        } catch (err) {
            console.error("Failed to download image", err);
        } finally {
            // Restore styles and show hidden rows
            element.style.width = originalWidth;
            element.style.maxWidth = originalMaxWidth;
            element.style.position = originalPosition;
            hiddenRows.forEach((row) => (row.style.display = "flex"));
            if (actionsBar) actionsBar.style.display = "flex";
            deleteButtons.forEach((btn) => (btn.style.visibility = "visible"));
        }
    };

    return (
        <div className="app-container">
            <div className="invoice-paper" ref={invoiceRef}>
                {/* Header Section */}
                <header className="invoice-header">
                    <div className="logo-section">
                        <div className="logo-circle">
                            <span className="logo-tag">APPLE</span>
                            <Apple className="apple-icon" />
                        </div>
                        <h1 className="brand-name">Apple(WaLoneLay)</h1>
                    </div>
                </header>

                {/* Title */}
                <div className="invoice-title-container">
                    <h2 className="invoice-main-title">INVOICE</h2>
                </div>

                {/* Info Grid */}
                <div className="info-grid">
                    <div className="info-block">
                        <label className="label-text">INVOICE TO:</label>
                        <input
                            className="editable-input client-name myanmar-text"
                            value={invoiceTo}
                            onChange={(e) => setInvoiceTo(e.target.value)}
                        />
                    </div>
                    <div className="info-block meta-info">
                        <div className="meta-row">
                            <span className="label-text meta-label">
                                INVOICE NUMBER:
                            </span>
                            <input
                                className="editable-input meta-value text-right myanmar-text"
                                value={invoiceNumber}
                                onChange={(e) =>
                                    setInvoiceNumber(e.target.value)
                                }
                            />
                        </div>
                        <div className="meta-row">
                            <span className="label-text meta-label">
                                INVOICE DATE:
                            </span>
                            <input
                                className="editable-input meta-value text-right uppercase myanmar-text"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>
                        <div className="meta-row">
                            <span className="label-text meta-label">
                                DUE DATE:
                            </span>
                            <input
                                className="editable-input meta-value text-right uppercase myanmar-text"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="table-wrapper">
                    <div className="table-container">
                        <div className="table-header">
                            <span className="col-task">TASK</span>
                            <span className="col-subtotal text-right">
                                SUBTOTAL
                            </span>
                        </div>

                        <div className="table-body">
                            {rows.map((row, index) => (
                                <div key={row.id} className="table-row">
                                    <div className="col-task">
                                        <textarea
                                            rows={1}
                                            placeholder="Enter task..."
                                            className="editable-textarea myanmar-text"
                                            value={row.task}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    row.id,
                                                    "task",
                                                    e.target.value
                                                )
                                            }
                                            onInput={(e) => {
                                                e.target.style.height = "auto";
                                                e.target.style.height =
                                                    e.target.scrollHeight +
                                                    "px";
                                            }}
                                        />
                                    </div>
                                    <div className="col-subtotal flex-row">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="editable-input text-right amount-input"
                                            value={row.subtotal}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    row.id,
                                                    "subtotal",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        {rows.length > 1 &&
                                            index !== rows.length - 1 && (
                                                <button
                                                    onClick={() =>
                                                        deleteRow(row.id)
                                                    }
                                                    className="delete-btn no-print"
                                                    aria-label="Delete row">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grand Total Area */}
                <div className="total-footer">
                    <div className="total-title-container">
                        <input
                            className="editable-input total-title-input myanmar-text"
                            value={totalTitle}
                            onChange={(e) => setTotalTitle(e.target.value)}
                        />
                    </div>
                    <div className="total-amount-container">
                        <input
                            className="editable-input total-value-input text-right"
                            value={displayTotal}
                            onChange={(e) => setManualTotal(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bottom Section */}
                <footer className="invoice-footer">
                    <div className="thank-you-section">
                        <p className="signature-text">Thank you!</p>
                    </div>

                    <div className="payment-box">
                        <p className="label-text payment-label">
                            PAYMENT INFORMATION
                        </p>
                        <div className="payment-details">
                            <div className="payment-row">
                                <span className="payment-key">
                                    Account Name :
                                </span>
                                <input
                                    className="editable-input payment-value myanmar-text"
                                    value={paymentInfo.accountName}
                                    onChange={(e) =>
                                        setPaymentInfo({
                                            ...paymentInfo,
                                            accountName: e.target.value
                                        })
                                    }
                                />
                            </div>
                            <div className="payment-row">
                                <span className="payment-key">
                                    Kpay Number :
                                </span>
                                <input
                                    className="editable-input payment-value"
                                    value={paymentInfo.kpayNumber}
                                    onChange={(e) =>
                                        setPaymentInfo({
                                            ...paymentInfo,
                                            kpayNumber: e.target.value
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <div className="actions-bar no-print">
                <button
                    onClick={downloadInvoice}
                    className="action-button secondary"
                    disabled={!libLoaded}>
                    <Download size={18} />
                    {libLoaded ? "Save Image" : "Loading..."}
                </button>
                <button
                    onClick={() => window.print()}
                    className="action-button primary">
                    <Printer size={18} />
                    Print PDF
                </button>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #f3f4f6; font-family: 'Inter', sans-serif; color: #374151; }

        .myanmar-text {
          font-family: 'Noto Sans Myanmar', 'Inter', sans-serif;
          line-height: 2 !important; 
          padding-top: 6px !important;
          padding-bottom: 6px !important;
        }

        .app-container {
          min-height: 100vh;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-bottom: 120px;
        }

        .invoice-paper {
          background: white;
          width: 100%;
          max-width: 800px;
          min-height: 1050px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 64px;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 640px) {
          .app-container { padding: 10px 10px 100px 10px; }
          .invoice-paper { padding: 24px; min-height: auto; }
          .brand-name { font-size: 24px !important; }
          .invoice-main-title { font-size: 32px !important; }
          .info-grid { flex-direction: column; gap: 24px; }
          .meta-info { width: 100%; text-align: left !important; }
          .meta-row { justify-content: space-between !important; }
          .total-footer { gap: 10px; }
          .total-value-input { width: 120px !important; }
          
          .table-wrapper {
            overflow-x: auto;
            margin: 0 -24px;
            padding: 0 24px;
            -webkit-overflow-scrolling: touch;
          }
          .table-container { min-width: 500px; }
        }

        .invoice-header { margin-bottom: 48px; }
        .logo-section { display: flex; align-items: center; gap: 16px; }
        .logo-circle {
          width: 64px; height: 64px; background-color: #fdf2f8;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; position: relative; flex-shrink: 0;
        }
        .logo-tag {
          position: absolute; top: 8px; font-size: 10px;
          color: #f9a8d4; font-weight: 700; letter-spacing: 0.1em;
        }
        .apple-icon { color: #ef4444; width: 32px; height: 32px; margin-top: 8px; fill: currentColor; }
        .brand-name { font-size: 48px; font-weight: 600; color: #4b5563; letter-spacing: -0.025em; }

        .invoice-title-container { margin-bottom: 48px; }
        .invoice-main-title { font-size: 48px; font-weight: 300; letter-spacing: 0.2em; color: #1f2937; }

        .info-grid { display: flex; justify-content: space-between; margin-bottom: 64px; font-size: 14px; }
        .label-text { color: #9ca3af; font-weight: 700; letter-spacing: 0.05em; font-size: 10px; text-transform: uppercase; }
        .meta-info { display: flex; flex-direction: column; gap: 4px; text-align: right; }
        .meta-row { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
        .meta-label { font-size: 9px; }

        .editable-input, .editable-textarea { border: none; background: transparent; outline: none; font-family: inherit; color: inherit; width: 100%; padding: 0; }
        .editable-input:focus, .editable-textarea:focus { background-color: #fff1f2; }
        .client-name { font-size: 18px; font-weight: 500; margin-top: 8px; }
        .meta-value { font-weight: 500; width: 180px; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }

        .table-container { flex-grow: 1; }
        .table-header {
          display: flex; border-bottom: 1px solid #111827;
          padding: 8px; background-color: rgba(253, 242, 248, 0.5);
          margin-bottom: 16px;
        }
        .col-task { flex: 3; font-weight: 700; font-size: 12px; color: #4b5563; }
        .col-subtotal { flex: 1; font-weight: 700; font-size: 12px; color: #4b5563; }
        
        .table-row { display: flex; padding: 8px; align-items: flex-start; gap: 16px; border-bottom: 1px solid transparent; }
        .table-row:hover { background-color: #fafafa; }
        .flex-row { display: flex; align-items: center; }
        .amount-input { font-weight: 500; font-size: 16px; }

        .total-footer {
          margin-top: 48px; border-top: 1px solid #111827;
          padding-top: 24px; display: flex; justify-content: flex-end;
          align-items: center; gap: 48px;
        }
        .total-title-input { font-size: 20px; font-weight: 700; width: 180px; text-align: right; }
        .total-value-input { font-size: 20px; font-weight: 600; width: 180px; }

        .invoice-footer { margin-top: auto; padding-top: 40px; }
        .signature-text { font-family: 'Great Vibes', cursive; font-size: 48px; color: #374151; margin-bottom: 48px; }
        .payment-box { background-color: #fdf2f8; padding: 24px; border-radius: 4px; }
        .payment-label { margin-bottom: 12px; }
        .payment-details { display: flex; flex-direction: column; gap: 4px; font-size: 14px; font-weight: 500; }
        .payment-row { display: flex; gap: 8px; }
        .payment-key { flex-shrink: 0; }
        .payment-value { font-weight: 600; }

        .delete-btn { background: none; border: none; color: #fca5a5; cursor: pointer; padding: 4px; visibility: hidden; }
        .table-row:hover .delete-btn { visibility: visible; }
        .delete-btn:hover { color: #ef4444; }

        .actions-bar {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 12px; background: white; padding: 12px 24px;
          border-radius: 9999px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 100; border: 1px solid #e5e7eb;
        }
        .action-button {
          display: flex; align-items: center; gap: 8px; padding: 10px 20px;
          border-radius: 9999px; border: none; font-weight: 600; font-size: 14px;
          cursor: pointer; transition: all 0.2s;
        }
        .action-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-button.primary { background-color: #111827; color: white; }
        .action-button.secondary { background-color: #f3f4f6; color: #374151; }
        .action-button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }

        @media print {
          .no-print { display: none !important; }
          body { background: white; padding: 0; }
          .app-container { padding: 0; }
          .invoice-paper { box-shadow: none; width: 100%; height: auto; min-height: auto; }
          .table-wrapper { overflow: visible !important; }
          .table-container { min-width: auto !important; }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
        </div>
    );
};

export default App;

const STORAGE_KEY = "kasa-yonetimi-v2";

const DEFAULT_START_BANK = 20000;

let data;

try {
    data =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
        {
            start: DEFAULT_START_BANK,
            entries: []
        };
} catch (e) {
    data = {
        start: DEFAULT_START_BANK,
        entries: []
    };
}

if (
    !Number.isFinite(Number(data.start)) ||
    Number(data.start) <= 0
) {
    data.start = DEFAULT_START_BANK;
}

if (!Array.isArray(data.entries)) {
    data.entries = [];
}


/* ==================================================
   VARSAYILAN SONUÇ
   ================================================== */

let selectedResult = "BEKLEMEDE";


const $ = id =>
    document.getElementById(id);


/* ==================================================
   PARA FORMATLAMA
   ================================================== */

function money(value) {

    return new Intl.NumberFormat(
        "tr-TR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    ) + " TL";
}


/* ==================================================
   VERİYİ KAYDET
   ================================================== */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* ==================================================
   KASA HESAPLAMA MANTIĞI
   ==================================================

   KAZANDI:
   Kasa + net kâr

   FİRE:
   Kasa - oynanan tutar

   BEKLEMEDE:
   Kupona yatırılan para kullanılabilir
   kasadan düşer.

   Örnek:

   Başlangıç = 20.000
   Risk = %20
   Tutar = 4.000

   BEKLEMEDE:
   Güncel kullanılabilir kasa = 16.000

   KAZANDI / oran 1.60:
   Gün sonu = 22.400

   FİRE:
   Gün sonu = 16.000
   ================================================== */


/* ==================================================
   TÜM KAYITLARI YENİDEN HESAPLA
   ================================================== */

function recalculateAll() {

    let runningBank =
        Number(data.start);


    data.entries.forEach(
        (item, index) => {

            const risk =
                Number(item.risk);

            const odds =
                Number(item.odds);

            const stake =
                runningBank *
                risk /
                100;


            let profitLoss = 0;
            let endBank = runningBank;


            if (
                item.result === "KAZANDI"
            ) {

                profitLoss =
                    stake *
                    (odds - 1);

                endBank =
                    runningBank +
                    profitLoss;

            } else if (
                item.result === "FİRE"
            ) {

                profitLoss =
                    -stake;

                endBank =
                    runningBank -
                    stake;

            } else {

                /*
                 BEKLEMEDE

                 Oynanan tutar kullanılabilir
                 kasadan düşüyor.
                */

                profitLoss = 0;

                endBank =
                    runningBank -
                    stake;
            }


            item.day =
                index + 1;

            item.startBank =
                runningBank;

            item.stake =
                stake;

            item.profitLoss =
                profitLoss;

            item.endBank =
                endBank;


            runningBank =
                endBank;
        }
    );


    saveData();
}


/* ==================================================
   GÜNCEL KASA
   ================================================== */

function currentBank() {

    if (
        data.entries.length === 0
    ) {
        return Number(data.start);
    }


    return Number(
        data.entries[
            data.entries.length - 1
        ].endBank
    );
}


/* ==================================================
   ÖNİZLEME
   ================================================== */

function calculatePreview() {

    const bank =
        currentBank();


    const risk =
        parseFloat(
            $("risk").value
        ) || 0;


    const odds =
        parseFloat(
            $("odds").value
        );


    const stake =
        bank *
        risk /
        100;


    $("stake").textContent =
        money(stake);


    if (
        selectedResult ===
        "BEKLEMEDE"
    ) {

        const availableBank =
            bank -
            stake;


        $("preview").textContent =
            "⏳ Kupon beklemede • " +
            "Kasadan ayrılan: " +
            money(stake) +
            " • Güncel kullanılabilir kasa: " +
            money(availableBank);

        return;
    }


    if (
        !Number.isFinite(odds) ||
        odds <= 1
    ) {

        $("preview").textContent =
            "Geçerli bir oran gir.";

        return;
    }


    if (
        selectedResult ===
        "KAZANDI"
    ) {

        const profit =
            stake *
            (odds - 1);


        const endBank =
            bank +
            profit;


        $("preview").textContent =
            "✅ Net kâr: +" +
            money(profit) +
            " • Gün sonu kasa: " +
            money(endBank);

    } else {

        const endBank =
            bank -
            stake;


        $("preview").textContent =
            "❌ Fire: -" +
            money(stake) +
            " • Gün sonu kasa: " +
            money(endBank);
    }
}


/* ==================================================
   EKRANI YENİLE
   ================================================== */

function render() {

    const bank =
        currentBank();


    $("startBank").textContent =
        money(data.start);


    $("currentBank").textContent =
        money(bank);


    /*
     GERÇEKLEŞMİŞ KÂR/ZARAR

     Bekleyen kuponu burada zarar
     olarak göstermiyoruz.
    */

    const settledProfitLoss =
        data.entries.reduce(
            (total, item) => {

                if (
                    item.result ===
                    "BEKLEMEDE"
                ) {
                    return total;
                }

                return total +
                    Number(
                        item.profitLoss
                    );
            },
            0
        );


    if (
        settledProfitLoss > 0
    ) {

        $("totalPL").textContent =
            "Toplam K/Z: +" +
            money(
                settledProfitLoss
            );

    } else if (
        settledProfitLoss < 0
    ) {

        $("totalPL").textContent =
            "Toplam K/Z: -" +
            money(
                Math.abs(
                    settledProfitLoss
                )
            );

    } else {

        $("totalPL").textContent =
            "Toplam K/Z: " +
            money(0);
    }


    const winCount =
        data.entries.filter(
            item =>
                item.result ===
                "KAZANDI"
        ).length;


    const fireCount =
        data.entries.filter(
            item =>
                item.result ===
                "FİRE"
        ).length;


    const pendingCount =
        data.entries.filter(
            item =>
                item.result ===
                "BEKLEMEDE"
        ).length;


    $("winDays").textContent =
        winCount;

    $("lossDays").textContent =
        fireCount;

    $("pendingDays").textContent =
        pendingCount;


    /* ==================================================
       TABLO
       ================================================== */

    const history =
        $("history");


    history.innerHTML =
        data.entries
        .map(
            (item, index) => {

                let rowClass;
                let resultClass;

                if (
                    item.result ===
                    "KAZANDI"
                ) {

                    rowClass =
                        "row-win";

                    resultClass =
                        "win";

                } else if (
                    item.result ===
                    "FİRE"
                ) {

                    rowClass =
                        "row-fire";

                    resultClass =
                        "fire";

                } else {

                    rowClass =
                        "row-pending";

                    resultClass =
                        "pending";
                }


                let profitClass;
                let profitText;


                if (
                    item.result ===
                    "BEKLEMEDE"
                ) {

                    profitClass =
                        "neutral";

                    profitText =
                        "BEKLİYOR";

                } else if (
                    Number(
                        item.profitLoss
                    ) >= 0
                ) {

                    profitClass =
                        "pos";

                    profitText =
                        "+" +
                        money(
                            item.profitLoss
                        );

                } else {

                    profitClass =
                        "neg";

                    profitText =
                        "-" +
                        money(
                            Math.abs(
                                item.profitLoss
                            )
                        );
                }


                return `

                <tr class="${rowClass}">

                    <td>
                        ${item.day}
                    </td>


                    <td>
                        ${money(
                            item.startBank
                        )}
                    </td>


                    <td>

                        <input
                            class="table-input risk-edit"
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value="${item.risk}"
                            data-index="${index}">

                    </td>


                    <td>
                        ${money(
                            item.stake
                        )}
                    </td>


                    <td>

                        <input
                            class="table-input odds-edit"
                            type="number"
                            min="1.01"
                            step="0.01"
                            value="${item.odds}"
                            data-index="${index}">

                    </td>


                    <td>

                        <button
                            type="button"
                            class="table-result ${resultClass}"
                            data-index="${index}">

                            ${item.result}

                        </button>

                    </td>


                    <td
                        class="${profitClass}">

                        ${profitText}

                    </td>


                    <td>

                        <b>
                            ${money(
                                item.endBank
                            )}
                        </b>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="delete-row"
                            data-index="${index}"
                            title="Kaydı Sil">

                            🗑️

                        </button>

                    </td>

                </tr>

                `;
            }
        )
        .join("");


    $("empty").style.display =
        data.entries.length
            ? "none"
            : "block";


    addTableEvents();

    calculatePreview();
}


/* ==================================================
   TABLO İŞLEMLERİ
   ================================================== */

function addTableEvents() {


    /* ==================================================
       RİSK DEĞİŞTİR
       ================================================== */

    document
    .querySelectorAll(
        ".risk-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 0 ||
                    value > 100
                ) {

                    alert(
                        "Risk % 0 ile 100 arasında olmalıdır."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].risk =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* ==================================================
       ORAN DEĞİŞTİR
       ================================================== */

    document
    .querySelectorAll(
        ".odds-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 1
                ) {

                    alert(
                        "Geçerli bir oran gir."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].odds =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* ==================================================
       SONUÇ DEĞİŞTİR

       KAZANDI → FİRE → BEKLEMEDE → KAZANDI
       ================================================== */

    document
    .querySelectorAll(
        ".table-result"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const currentResult =
                    data.entries[
                        index
                    ].result;


                if (
                    currentResult ===
                    "KAZANDI"
                ) {

                    data.entries[
                        index
                    ].result =
                        "FİRE";

                } else if (
                    currentResult ===
                    "FİRE"
                ) {

                    data.entries[
                        index
                    ].result =
                        "BEKLEMEDE";

                } else {

                    data.entries[
                        index
                    ].result =
                        "KAZANDI";
                }


                recalculateAll();

                render();
            }
        );
    });


    /* ==================================================
       TEK SATIR SİL
       ================================================== */

    document
    .querySelectorAll(
        ".delete-row"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const day =
                    data.entries[
                        index
                    ].day;


                const approved =
                    confirm(
                        day +
                        ". gün kaydı silinsin mi?"
                    );


                if (!approved) {
                    return;
                }


                data.entries.splice(
                    index,
                    1
                );


                recalculateAll();

                render();
            }
        );
    });
}


/* ==================================================
   RİSK / ORAN CANLI HESAPLAMA
   ================================================== */

$("risk").addEventListener(
    "input",
    calculatePreview
);


$("odds").addEventListener(
    "input",
    calculatePreview
);


/* ==================================================
   YENİ KUPON SONUÇ SEÇİMİ
   ================================================== */

document
.querySelectorAll(
    ".result-button"
)
.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectedResult =
                button.dataset.result;


            document
            .querySelectorAll(
                ".result-button"
            )
            .forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            calculatePreview();
        }
    );
});


/* ==================================================
   KUPONU KAYDET
   ================================================== */

$("save").addEventListener(
    "click",
    () => {

        const risk =
            parseFloat(
                $("risk").value
            );


        const odds =
            parseFloat(
                $("odds").value
            );


        if (
            !Number.isFinite(risk) ||
            risk <= 0 ||
            risk > 100
        ) {

            alert(
                "Risk % 0 ile 100 arasında olmalıdır."
            );

            return;
        }


        /*
         BEKLEMEDE dahil her kupon için
         oranı kaydediyoruz.
        */

        if (
            !Number.isFinite(odds) ||
            odds <= 1
        ) {

            alert(
                "Geçerli bir oran gir."
            );

            return;
        }


        const bank =
            currentBank();


        if (
            bank <= 0
        ) {

            alert(
                "Kullanılabilir kasa bulunmuyor."
            );

            return;
        }


        const stake =
            bank *
            risk /
            100;


        data.entries.push({

            day:
                data.entries.length + 1,

            startBank:
                bank,

            risk:
                risk,

            stake:
                stake,

            odds:
                odds,

            result:
                selectedResult,

            profitLoss:
                0,

            endBank:
                bank
        });


        recalculateAll();


        $("odds").value =
            "";


        /*
         Yeni kupondan sonra tekrar
         BEKLEMEDE varsayılanına dön.
        */

        selectedResult =
            "BEKLEMEDE";


        document
        .querySelectorAll(
            ".result-button"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


        document
        .querySelector(
            '.result-button[data-result="BEKLEMEDE"]'
        )
        .classList.add(
            "active"
        );


        render();
    }
);


/* ==================================================
   BAŞLANGIÇ KASASINI DEĞİŞTİR
   ================================================== */

$("changeStartBank")
.addEventListener(
    "click",
    () => {

        const entered =
            prompt(
                "Başlangıç kasasını gir:",
                Number(data.start)
            );


        if (
            entered === null
        ) {
            return;
        }


        /*
         20.000
         20000
         20.000,50

         formatlarını okuyabilsin.
        */

        let cleaned =
            String(entered)
            .trim()
            .replace(/\s/g, "");


        if (
            cleaned.includes(",")
        ) {

            cleaned =
                cleaned
                .replace(/\./g, "")
                .replace(",", ".");

        } else {

            if (
                /^\d{1,3}(\.\d{3})+$/
                .test(cleaned)
            ) {

                cleaned =
                    cleaned.replace(
                        /\./g,
                        ""
                    );
            }
        }


        const newStartBank =
            Number(cleaned);


        if (
            !Number.isFinite(
                newStartBank
            ) ||
            newStartBank <= 0
        ) {

            alert(
                "Geçerli bir başlangıç kasası gir."
            );

            return;
        }


        if (
            data.entries.length > 0
        ) {

            const approved =
                confirm(
                    "Başlangıç kasası " +
                    money(newStartBank) +
                    " olarak değiştirilsin mi?\n\n" +
                    "Mevcut kayıtlar silinmeyecek ve tüm hesaplamalar yeniden yapılacaktır."
                );


            if (!approved) {
                return;
            }
        }


        data.start =
            newStartBank;


        recalculateAll();

        render();
    }
);


/* ==================================================
   TÜMÜNÜ SİL
   ================================================== */

$("reset").addEventListener(
    "click",
    () => {

        const approved =
            confirm(
                "Tüm kupon kayıtları silinsin mi?\n\nBaşlangıç kasası korunacaktır."
            );


        if (!approved) {
            return;
        }


        data.entries =
            [];


        saveData();

        render();
    }
);


/* ==================================================
   UYGULAMA AÇILIŞI
   ================================================== */

recalculateAll();

render();

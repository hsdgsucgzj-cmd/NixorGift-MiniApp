const tg = window.Telegram?.WebApp;

const API_BASE = "https://ТВОЙ_АДРЕС_API/api";

let currentUser = null;
let currentPage = "home";
let userData = null;
let nftData = [];
let winsData = [];
let withdrawalsData = [];


/* =========================
   TELEGRAM
========================= */

function initTelegram() {
    if (!tg) {
        console.warn("Telegram WebApp API не найден");
        return;
    }

    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
        tg.setHeaderColor("#0f1117");
    }

    if (tg.setBackgroundColor) {
        tg.setBackgroundColor("#0f1117");
    }

    currentUser = tg.initDataUnsafe?.user || null;
}


/* =========================
   API
========================= */

async function apiRequest(endpoint, method = "GET", body = null) {
    try {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body !== null) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(
            `${API_BASE}${endpoint}`,
            options
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP ${response.status}`
            );
        }

        if (data.ok === false) {
            throw new Error(
                data.error || "Ошибка API"
            );
        }

        return data;

    } catch (error) {
        console.error(`API ${endpoint}:`, error);

        showToast(
            error.message ||
            "Ошибка соединения с сервером"
        );

        return null;
    }
}


/* =========================
   USER
========================= */

function getUserId() {
    return currentUser?.id || null;
}

function getUsername() {
    return currentUser?.username || "";
}

async function loadUser() {
    if (!getUserId()) {
        console.warn(
            "Пользователь Telegram не найден"
        );
        return;
    }

    const data = await apiRequest(
        "/user",
        "POST",
        {
            user_id: getUserId(),
            username: getUsername(),
            first_name: currentUser.first_name || "",
            last_name: currentUser.last_name || ""
        }
    );

    if (!data) {
        return;
    }

    userData = data.user || data;

    updateUserInterface();
}

function updateUserInterface() {
    if (!userData) {
        return;
    }

    const balance =
        userData.balance ??
        userData.stars ??
        0;

    document
        .querySelectorAll("[data-balance]")
        .forEach(element => {
            element.textContent =
                Number(balance).toLocaleString("ru-RU");
        });

    const firstName =
        userData.first_name ||
        currentUser?.first_name ||
        "Пользователь";

    const username =
        userData.username ||
        currentUser?.username ||
        "";

    document
        .querySelectorAll("[data-profile-name]")
        .forEach(element => {
            element.textContent = firstName;
        });

    document
        .querySelectorAll("[data-profile-username]")
        .forEach(element => {
            element.textContent =
                username ? `@${username}` : "";
        });

    const avatar =
        userData.photo_url ||
        currentUser?.photo_url ||
        "";

    document
        .querySelectorAll("[data-avatar]")
        .forEach(element => {
            if (avatar) {
                element.src = avatar;
            }
        });
}


/* =========================
   NFT
========================= */

async function loadNFT() {
    const data = await apiRequest("/nft");

    if (!data) {
        return;
    }

    nftData =
        data.nft ||
        data.items ||
        [];

    renderNFT();
}

function renderNFT() {
    const container =
        document.querySelector("#nft-list") ||
        document.querySelector(".nft-grid");

    if (!container) {
        return;
    }

    if (!nftData.length) {
        return;
    }

    container.innerHTML = nftData
        .map(item => {
            const name =
                item.name ||
                item.title ||
                "NFT";

            const image =
                item.image ||
                "";

            return `
                <div class="nft-card">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(name)}"
                                >
                            `
                            : `
                                <div class="nft-image-placeholder">
                                    🎁
                                </div>
                            `
                    }

                    <div class="nft-name">
                        ${escapeHtml(name)}
                    </div>

                </div>
            `;
        })
        .join("");
}


/* =========================
   WINS
========================= */

async function loadWins() {
    if (!getUserId()) {
        return;
    }

    const data = await apiRequest(
        "/wins",
        "POST",
        {
            user_id: getUserId()
        }
    );

    if (!data) {
        return;
    }

    winsData =
        data.wins ||
        [];

    renderWins();
}

function renderWins() {
    const containers = [
        document.querySelector("#wins-list"),
        document.querySelector(".wins-list")
    ].filter(Boolean);

    if (!containers.length) {
        return;
    }

    const html = winsData.length
        ? winsData
            .map(win => {
                const name =
                    win.prize_name ||
                    win.name ||
                    "Подарок";

                const image =
                    win.image ||
                    "";

                const date =
                    win.created_at ||
                    win.date ||
                    "";

                return `
                    <div class="win-card">

                        <div class="win-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHtml(image)}"
                                            alt="${escapeHtml(name)}"
                                        >
                                    `
                                    : "🎁"
                            }

                        </div>

                        <div class="win-info">

                            <div class="win-name">
                                ${escapeHtml(name)}
                            </div>

                            ${
                                date
                                    ? `
                                        <div class="win-date">
                                            ${escapeHtml(
                                                formatDate(date)
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;
            })
            .join("")
        : `
            <div class="empty-state">

                <div class="empty-icon">
                    🎁
                </div>

                <div>
                    У тебя пока нет выигрышей
                </div>

            </div>
        `;

    containers.forEach(container => {
        container.innerHTML = html;
    });
}


/* =========================
   WITHDRAWALS
========================= */

async function loadWithdrawals() {
    if (!getUserId()) {
        return;
    }

    const data = await apiRequest(
        "/withdrawals",
        "POST",
        {
            user_id: getUserId()
        }
    );

    if (!data) {
        return;
    }

    withdrawalsData =
        data.withdrawals ||
        [];

    renderWithdrawals();
}

function renderWithdrawals() {
    const containers = [
        document.querySelector("#withdrawals-list"),
        document.querySelector(".withdrawals-list")
    ].filter(Boolean);

    if (!containers.length) {
        return;
    }

    const html = withdrawalsData.length
        ? withdrawalsData
            .map(item => {
                const name =
                    item.prize_name ||
                    item.name ||
                    "Подарок";

                const status =
                    item.status ||
                    "pending";

                let statusText =
                    "Ожидает отправки";

                if (status === "sent") {
                    statusText =
                        "Отправлено";
                }

                if (status === "rejected") {
                    statusText =
                        "Отклонено";
                }

                return `
                    <div class="withdrawal-card">

                        <div class="withdrawal-name">
                            ${escapeHtml(name)}
                        </div>

                        <div
                            class="withdrawal-status status-${escapeHtml(status)}"
                        >
                            ${escapeHtml(statusText)}
                        </div>

                    </div>
                `;
            })
            .join("")
        : `
            <div class="empty-state">

                <div class="empty-icon">
                    📦
                </div>

                <div>
                    Заявок на вывод пока нет
                </div>

            </div>
        `;

    containers.forEach(container => {
        container.innerHTML = html;
    });
}


/* =========================
   OPEN CASE
========================= */

async function openCase(caseType) {
    if (!getUserId()) {
        showToast(
            "Пользователь не найден"
        );
        return;
    }

    if (
        caseType !== "starter" &&
        caseType !== "nft"
    ) {
        showToast(
            "Неизвестный кейс"
        );
        return;
    }

    const button =
        document.querySelector(
            `[data-case="${caseType}"]`
        );

    if (button) {
        button.disabled = true;
    }

    const caseName =
        caseType === "starter"
            ? "Starter Case"
            : "NFT Case";

    showToast(
        `Открываем ${caseName}...`
    );

    const data = await apiRequest(
        "/open-case",
        "POST",
        {
            user_id: getUserId(),
            case_type: caseType
        }
    );

    if (button) {
        button.disabled = false;
    }

    if (!data) {
        return;
    }

    const prize =
        data.prize || {};

    const prizeName =
        prize.name ||
        "Неизвестный приз";

    const prizeType =
        prize.type ||
        "unknown";

    await sleep(500);

    if (prizeType === "stars") {
        showPrizePopup(
            "🎉 Ты выиграл!",
            `⭐ ${prizeName}`
        );
    } else {
        showPrizePopup(
            "🎉 Поздравляем!",
            prizeName
        );
    }

    await loadUser();
    await loadWins();
}


/* =========================
   PRIZE POPUP
========================= */

function showPrizePopup(title, prizeName) {
    let popup =
        document.querySelector(
            "#nixorgift-prize-popup"
        );

    if (!popup) {
        popup =
            document.createElement("div");

        popup.id =
            "nixorgift-prize-popup";

        popup.innerHTML = `
            <div class="nixorgift-popup-overlay">

                <div class="nixorgift-popup">

                    <div
                        class="nixorgift-popup-title"
                        id="nixorgift-popup-title"
                    ></div>

                    <div
                        class="nixorgift-popup-prize"
                        id="nixorgift-popup-prize"
                    ></div>

                    <button
                        type="button"
                        id="nixorgift-popup-close"
                    >
                        Забрать
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(popup);

        const overlay =
            popup.querySelector(
                ".nixorgift-popup-overlay"
            );

        const closeButton =
            popup.querySelector(
                "#nixorgift-popup-close"
            );

        closeButton.addEventListener(
            "click",
            () => {
                popup.remove();
            }
        );

        overlay.addEventListener(
            "click",
            event => {
                if (event.target === overlay) {
                    popup.remove();
                }
            }
        );

        addPopupStyles();
    }

    popup.querySelector(
        "#nixorgift-popup-title"
    ).textContent = title;

    popup.querySelector(
        "#nixorgift-popup-prize"
    ).textContent = prizeName;

    popup.style.display = "block";
}


/* =========================
   POPUP STYLE
========================= */

function addPopupStyles() {
    if (
        document.querySelector(
            "#nixorgift-popup-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "nixorgift-popup-styles";

    style.textContent = `
        #nixorgift-prize-popup {
            position: fixed;
            inset: 0;
            z-index: 10000;
        }

        .nixorgift-popup-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.72);
        }

        .nixorgift-popup {
            width: min(360px, 100%);
            padding: 28px 22px;
            border-radius: 24px;
            background: #151922;
            text-align: center;
            box-shadow:
                0 20px 70px rgba(0, 0, 0, 0.5);
            animation: nixorgiftPopupIn .22s ease;
        }

        .nixorgift-popup-title {
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 18px;
        }

        .nixorgift-popup-prize {
            font-size: 25px;
            font-weight: 800;
            margin-bottom: 24px;
            word-break: break-word;
        }

        .nixorgift-popup button {
            width: 100%;
            min-height: 48px;
            border: 0;
            border-radius: 14px;
            background: #ffffff;
            color: #111111;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
        }

        @keyframes nixorgiftPopupIn {
            from {
                opacity: 0;
                transform: scale(.92);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;

    document.head.appendChild(style);
}
/* =========================
   WITHDRAW
========================= */

async function createWithdrawal(prizeName) {
    if (!getUserId()) {
        showToast(
            "Пользователь не найден"
        );
        return;
    }

    if (!prizeName) {
        showToast(
            "Выбери подарок"
        );
        return;
    }

    const confirmed =
        window.confirm(
            `Вывести "${prizeName}"?\n\n` +
            `После создания заявки подарок будет ` +
            `удалён из выигрышей.`
        );

    if (!confirmed) {
        return;
    }

    const data = await apiRequest(
        "/withdraw",
        "POST",
        {
            user_id: getUserId(),
            prize_name: prizeName
        }
    );

    if (!data) {
        return;
    }

    showToast(
        "Заявка на вывод создана"
    );

    await loadWins();
    await loadWithdrawals();

    openPage("withdraw");
}


/* =========================
   REFERRALS
========================= */

async function copyReferralLink() {
    if (!getUserId()) {
        return;
    }

    const botUsername =
        window.NIXORGIFT_BOT_USERNAME ||
        "NixorGiftBot";

    const link =
        `https://t.me/${botUsername}` +
        `?start=ref_${getUserId()}`;

    try {
        await navigator.clipboard.writeText(
            link
        );

        showToast(
            "Реферальная ссылка скопирована"
        );

    } catch {
        showToast(link);
    }
}


/* =========================
   PROMO
========================= */

function usePromo() {
    const input =
        document.querySelector(
            "#promo-code"
        ) ||
        document.querySelector(
            "input[name='promo']"
        );

    if (!input) {
        showToast(
            "Поле промокода не найдено"
        );
        return;
    }

    const code =
        input.value.trim();

    if (!code) {
        showToast(
            "Введи промокод"
        );
        return;
    }

    showToast(
        "Система промокодов подключается"
    );
}


/* =========================
   ADMIN
========================= */

async function loadAdmin() {
    if (!getUserId()) {
        return;
    }

    const data = await apiRequest(
        "/admin",
        "POST",
        {
            user_id: getUserId(),
            username: getUsername(),
            action: "stats"
        }
    );

    if (!data) {
        return;
    }

    const stats =
        data.stats ||
        data;

    document
        .querySelectorAll("[data-stat-users]")
        .forEach(element => {
            element.textContent =
                Number(
                    stats.users || 0
                ).toLocaleString("ru-RU");
        });

    document
        .querySelectorAll("[data-stat-wins]")
        .forEach(element => {
            element.textContent =
                Number(
                    stats.wins || 0
                ).toLocaleString("ru-RU");
        });

    document
        .querySelectorAll("[data-stat-withdrawals]")
        .forEach(element => {
            element.textContent =
                Number(
                    stats.withdrawals || 0
                ).toLocaleString("ru-RU");
        });
}


/* =========================
   SENDER
========================= */

async function loadSender() {
    if (!getUserId()) {
        return;
    }

    const data = await apiRequest(
        "/sender",
        "POST",
        {
            user_id: getUserId(),
            username: getUsername(),
            action: "pending"
        }
    );

    if (!data) {
        return;
    }

    const withdrawals =
        data.withdrawals ||
        data.items ||
        [];

    const container =
        document.querySelector(
            "#sender-list"
        ) ||
        document.querySelector(
            ".sender-list"
        );

    if (!container) {
        return;
    }

    if (!withdrawals.length) {
        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📭
                </div>

                <div>
                    Нет заявок на отправку
                </div>

            </div>
        `;

        return;
    }

    container.innerHTML =
        withdrawals
            .map(item => {
                return `
                    <div class="sender-card">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    item.prize_name ||
                                    item.name ||
                                    "Подарок"
                                )}
                            </strong>

                            <div>
                                Пользователь:
                                ${escapeHtml(
                                    item.username ||
                                    item.user_id ||
                                    ""
                                )}
                            </div>

                        </div>

                        <div class="sender-actions">

                            <button
                                type="button"
                                onclick="senderAction(
                                    ${Number(item.id)},
                                    'sent'
                                )"
                            >
                                Отправлено
                            </button>

                            <button
                                type="button"
                                onclick="senderAction(
                                    ${Number(item.id)},
                                    'rejected'
                                )"
                            >
                                Отклонить
                            </button>

                        </div>

                    </div>
                `;
            })
            .join("");
}

async function senderAction(
    withdrawalId,
    status
) {
    if (!getUserId()) {
        return;
    }

    const data = await apiRequest(
        "/sender",
        "POST",
        {
            user_id: getUserId(),
            username: getUsername(),
            action: status,
            withdrawal_id: withdrawalId
        }
    );

    if (!data) {
        return;
    }

    showToast(
        status === "sent"
            ? "Заявка отмечена как отправленная"
            : "Заявка отклонена"
    );

    await loadSender();
}


/* =========================
   NAVIGATION
========================= */

function openPage(pageName) {
    currentPage = pageName;

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove(
                "active"
            );
        });

    const page =
        document.querySelector(
            `#page-${pageName}`
        ) ||
        document.querySelector(
            `[data-page="${pageName}"]`
        );

    if (page) {
        page.classList.add(
            "active"
        );
    }

    document
        .querySelectorAll("[data-nav]")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.nav === pageName
            );
        });

    if (tg?.BackButton) {
        if (pageName === "home") {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }

    if (pageName === "wins") {
        loadWins();
    }

    if (pageName === "withdraw") {
        loadWins();
        loadWithdrawals();
    }

    if (pageName === "nft") {
        loadNFT();
    }

    if (pageName === "admin") {
        loadAdmin();
    }

    if (pageName === "sender") {
        loadSender();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================
   TOAST
========================= */

function showToast(message) {
    let toast =
        document.querySelector(
            "#nixorgift-toast"
        );

    if (!toast) {
        toast =
            document.createElement("div");

        toast.id =
            "nixorgift-toast";

        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "90px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "9999";

        toast.style.maxWidth =
            "90%";

        toast.style.padding =
            "12px 18px";

        toast.style.borderRadius =
            "14px";

        toast.style.background =
            "rgba(20, 23, 31, 0.96)";

        toast.style.color =
            "#fff";

        toast.style.fontSize =
            "14px";

        toast.style.textAlign =
            "center";

        toast.style.boxShadow =
            "0 8px 30px rgba(0,0,0,.35)";

        toast.style.opacity =
            "0";

        toast.style.transition =
            "opacity .2s ease";

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.style.opacity =
        "1";

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(() => {
            toast.style.opacity =
                "0";
        }, 2500);
}


/* =========================
   HELPERS
========================= */

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString(
        "ru-RU",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function escapeHtml(value) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(
            resolve,
            ms
        )
    );
}


/* =========================
   GLOBAL HANDLERS
========================= */

window.openPage =
    openPage;

window.openCase =
    openCase;

window.createWithdrawal =
    createWithdrawal;

window.copyReferralLink =
    copyReferralLink;

window.usePromo =
    usePromo;

window.senderAction =
    senderAction;


/* =========================
   BACK BUTTON
========================= */

function setupBackButton() {
    if (!tg?.BackButton) {
        return;
    }

    tg.BackButton.onClick(() => {

        if (currentPage !== "home") {
            openPage("home");
        } else {
            tg.close();
        }

    });
}


/* =========================
   NAV BUTTONS
========================= */

function setupNavigation() {

    document
        .querySelectorAll("[data-nav]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.nav;

                    if (page) {
                        openPage(page);
                    }

                }
            );

        });


    document
        .querySelectorAll(
            "[data-open-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.openPage;

                    if (page) {
                        openPage(page);
                    }

                }
            );

        });
}


/* =========================
   CASE BUTTONS
========================= */

function setupCaseButtons() {

    document
        .querySelectorAll(
            "[data-case]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const caseType =
                        button.dataset.case;

                    if (caseType) {
                        openCase(
                            caseType
                        );
                    }

                }
            );

        });
}


/* =========================
   INIT
========================= */

async function initApp() {

    initTelegram();

    setupBackButton();

    setupNavigation();

    setupCaseButtons();

    await loadUser();

    await loadNFT();

    await loadWins();

    await loadWithdrawals();

    openPage("home");
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

} else {

    initApp();

}
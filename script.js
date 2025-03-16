const ACCESS_KEY = "K3Ta7rSOP1-QNWYwx7whmMxH3-OVTh9n5oAAOed0kI4"; // استبدل هذا بـ Access Key الخاص بك
let currentLevel = 5; // العدد الافتراضي للصور
const levelSelector = document.getElementById("level");

let originalImages = []; // مصفوفة جديدة للاحتفاظ بالترتيب الأصلي
let shuffledImages = [];
let selectedImages = [];
let isGameStarted = false;

const largeImageContainer = document.getElementById("large-image-container");
const thumbnailBar = document.getElementById("thumbnail-bar");
const numberedBar = document.getElementById("numbered-bar");
const nextBtn = document.getElementById("next-btn");
const checkBtn = document.getElementById("check-btn");
const message = document.getElementById("message");

let selectedThumbnail = null; // متغير جديد لتتبع الصورة المحددة

// تعديل رابط API ليستخدم عدد الصور المحدد
function getApiUrl(count) {
    return `https://api.unsplash.com/photos/random?client_id=${ACCESS_KEY}&count=${count}`;
}

// جلب الصور من Unsplash
async function fetchImages() {
    try {
        const response = await fetch(getApiUrl(currentLevel));
        const data = await response.json();
        return data.map((photo) => photo.urls.small);
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

// دورة لخلط الصور
function shuffleArray(array) {
    let currentArray = [...array]; // نسخة جديدة من المصفوفة
    for (let i = currentArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentArray[i], currentArray[j]] = [currentArray[j], currentArray[i]];
    }
    return currentArray;
}

// عرض الصورة الكبيرة
function displayLargeImage(imageUrl) {
    largeImageContainer.innerHTML = `<img src="${imageUrl}" alt="Large Image">`;
}

// عرض الصور في شريط صغير
function displayThumbnails(images) {
    thumbnailBar.innerHTML = "";
    images.forEach((image, index) => {
        const thumbnail = document.createElement("div");
        thumbnail.classList.add("thumbnail");
        thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}" draggable="true" data-image-url="${image}">`;
        
        // إضافة معالجات السحب
        thumbnail.querySelector('img').addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain", image);
            e.target.closest('.thumbnail').classList.add('dragging');
        });
        
        thumbnail.querySelector('img').addEventListener('dragend', (e) => {
            e.target.closest('.thumbnail').classList.remove('dragging');
        });
        
        // إضافة معالج النقر للأجهزة المحمولة
        thumbnail.addEventListener("click", (e) => {
            // إذا كانت الصورة مخفية، لا تستجب للنقر
            if (thumbnail.style.visibility === 'hidden') return;

            // إزالة التحديد من الصورة السابقة
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
            
            if (selectedThumbnail === image) {
                // إذا نقرنا على نفس الصورة مرتين، نلغي تحديدها
                selectedThumbnail = null;
                thumbnail.classList.remove('selected');
            } else {
                // تحديد الصورة الجديدة
                selectedThumbnail = image;
                thumbnail.classList.add('selected');
            }
            
            // عرض الصورة في العارض الكبير
            displayLargeImage(image);
        });
        
        thumbnailBar.appendChild(thumbnail);
    });
}

// عرض الشريط المرقم
function displayNumberedBar() {
    numberedBar.innerHTML = "";
    for (let i = 1; i <= shuffledImages.length; i++) {
        const slot = document.createElement("div");
        slot.classList.add("numbered-slot");
        slot.textContent = i;
        
        // إضافة معالجات السحب والإفلات
        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", handleDrop.bind(null, slot, i - 1));
        
        // إضافة معالج النقر للأجهزة المحمولة
        slot.addEventListener("click", () => {
            if (selectedThumbnail) {
                handleDrop(slot, i - 1, { preventDefault: () => {}, dataTransfer: { getData: () => selectedThumbnail } });
                selectedThumbnail = null;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
            }
        });

        numberedBar.appendChild(slot);
    }
    numberedBar.classList.remove("hidden");
}

// دالة مساعدة للتعامل مع إفلات/وضع الصور
function handleDrop(slot, index, e) {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData("text/plain");
    
    if (slot.querySelector('img')) {
        const oldImageUrl = slot.querySelector('img').src;
        const oldThumbnail = thumbnailBar.querySelector(`img[data-image-url="${oldImageUrl}"]`);
        if (oldThumbnail) {
            oldThumbnail.closest('.thumbnail').style.visibility = 'visible';
        }
    }
    
    slot.innerHTML = `<img src="${imageUrl}" alt="Dropped Image" draggable="true">`;
    selectedImages[index] = imageUrl;
    
    const draggedImage = thumbnailBar.querySelector(`img[data-image-url="${imageUrl}"]`);
    if (draggedImage) {
        draggedImage.closest('.thumbnail').style.visibility = 'hidden';
    }
    
    checkCompleteness();
}

// إضافة دالة جديدة للتحقق من اكتمال الترتيب
function checkCompleteness() {
    const isComplete = selectedImages.every(image => image !== null);
    if (isComplete) {
        checkBtn.disabled = false;
        checkBtn.classList.remove('btn-secondary');
        checkBtn.classList.add('btn-success');
        message.textContent = "يمكنك الآن التحقق من الترتيب!";
    } else {
        checkBtn.disabled = true;
        checkBtn.classList.remove('btn-success');
        checkBtn.classList.add('btn-secondary');
        message.textContent = "قم بترتيب جميع الصور أولاً";
    }
}

// بدء اللعبة
async function startGame() {
    // إعادة التنسيق الأصلي
    document.body.style.backgroundColor = "";
    message.style.color = "";
    numberedBar.querySelectorAll('.numbered-slot').forEach(slot => {
        slot.style.borderColor = "#ccc";
        slot.style.backgroundColor = "";
    });

    // إخفاء شريط الترتيب
    numberedBar.classList.add("hidden");
    checkBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = "الانتقال إلى مرحلة التذكر";

    const images = await fetchImages();
    if (images.length === 0) {
        message.textContent = "فشل في جلب الصور. حاول مرة أخرى.";
        return;
    }

    shuffledImages = [...images];
    originalImages = [...images];
    selectedImages = new Array(shuffledImages.length).fill(null);
    isGameStarted = true;
    displayThumbnails(shuffledImages);
    message.textContent = `المستوى ${levelSelector.selectedIndex + 1}: انقر على الصور لرؤيتها بشكل كبير، ثم اضغط على الزر للانتقال إلى مرحلة التذكر.`;
    
    // تعطيل تغيير المستوى أثناء اللعب
    levelSelector.disabled = true;
}

// الانتقال إلى مرحلة التذكر
function startMemoryPhase() {
    // إعادة التنسيق الأصلي
    document.body.style.backgroundColor = "";
    message.style.color = "";
    numberedBar.querySelectorAll('.numbered-slot').forEach(slot => {
        slot.style.borderColor = "#ccc";
        slot.style.backgroundColor = "";
    });
    
    nextBtn.classList.add("hidden");
    displayNumberedBar();
    checkBtn.classList.remove("hidden");
    checkBtn.disabled = true;
    checkBtn.classList.remove('btn-success');
    checkBtn.classList.add('btn-secondary');
    
    // إعادة خلط الصور في شريط الصور المصغرة
    shuffledImages = shuffleArray([...originalImages]);
    displayThumbnails(shuffledImages);
    
    message.textContent = "قم بترتيب جميع الصور أولاً";
}

// التحقق من الترتيب
function checkOrder() {
    let isAllCorrect = true;
    
    originalImages.forEach((originalImage, index) => {
        const slot = numberedBar.children[index];
        if (selectedImages[index] === originalImage) {
            slot.style.borderColor = "#28a745";
            slot.style.backgroundColor = "#c3e6cb";
        } else {
            slot.style.borderColor = "#dc3545";
            slot.style.backgroundColor = "#f5c6cb";
            isAllCorrect = false;
        }
    });
    
    if (isAllCorrect) {
        message.textContent = `مبروك! لقد أكملت المستوى ${levelSelector.selectedIndex + 1} بنجاح!`;
        document.body.style.backgroundColor = "#d4edda";
        message.style.color = "#155724";
    } else {
        message.textContent = "للأسف، الترتيب غير صحيح. الصور الخضراء في مكانها الصحيح!";
        document.body.style.backgroundColor = "#f8d7da";
        message.style.color = "#721c24";
    }
    
    isGameStarted = false;
    nextBtn.textContent = "ابدأ من جديد";
    nextBtn.classList.remove("hidden");
    checkBtn.classList.add("hidden");
    
    // إعادة تفعيل تغيير المستوى
    levelSelector.disabled = false;
}

// إضافة مستمع حدث لتغيير المستوى
levelSelector.addEventListener("change", (e) => {
    currentLevel = parseInt(e.target.value);
    startGame();
});

// بدء اللعبة عند تحميل الصفحة
window.onload = startGame;

// تعديل مستمع الحدث للزر
nextBtn.addEventListener("click", () => {
    if (nextBtn.textContent === "ابدأ من جديد") {
        startGame();
    } else {
        startMemoryPhase();
    }
});

// التحقق من الترتيب عند النقر على زر "تحقق من الترتيب"
checkBtn.addEventListener("click", checkOrder);

// إضافة الأنماط CSS للصور المحددة
const style = document.createElement('style');
style.textContent = `
    .thumbnail.selected {
        border: 3px solid #007bff;
        transform: scale(1.05);
    }
    .thumbnail {
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }
    @media (max-width: 768px) {
        .thumbnail.selected {
            border-width: 2px;
        }
    }
`;
document.head.appendChild(style);
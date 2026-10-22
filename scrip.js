
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/7FC6j1Utl/";

let model = null;
let stream = null;
let selectedImage = null;
let isPredicting = false;

const video = document.getElementById("video");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("placeholder");
const fileInput = document.getElementById("fileInput");
const modelStatus = document.getElementById("modelStatus");

const startCameraButton = document.getElementById("startCamera");
const captureButton = document.getElementById("capture");
const identifyButton = document.getElementById("identify");
const resetButton = document.getElementById("reset");

const resultPlaceholder = document.getElementById("resultPlaceholder");
const result = document.getElementById("result");

const descriptions = {
    "Современная архитектура": {
        description:
            "Современная архитектура использует новые технологии, разнообразные геометрические формы, стекло, металл и железобетон.",
        tip:
            "Обрати внимание на панорамное остекление, необычный силуэт, современные фасадные системы и конструктивные решения."
    },

    "Советский модернизм": {
        description:
            "Советский модернизм получил широкое распространение в 1950–1980-х годах. Для него характерны крупные геометрические объёмы и выразительные конструкции.",
        tip:
            "Ищи монументальные формы, бетонные поверхности, крупные общественные здания и необычные консольные элементы."
    },

    "Хрущёвки": {
        description:
            "Хрущёвки — типовые жилые дома массового строительства, особенно распространённые с конца 1950-х годов.",
        tip:
            "Обрати внимание на небольшую этажность, повторяющиеся окна, простые фасады, балконы и отсутствие сложного декора."
    },

    "Классицизм": {
        description:
            "Классицизм опирается на симметрию, пропорции, колонны и традиции античной архитектуры.",
        tip:
            "Проверь симметрию фасада, наличие колонн, фронтона и регулярное расположение окон."
    },

    "Готика": {
        description:
            "Готическая архитектура отличается вертикальностью, стрельчатыми арками, сводами и витражами.",
        tip:
            "Ищи высокие башни, стрельчатые окна и арки, декоративные каменные элементы."
    },

    "Барокко": {
        description:
            "Барокко — архитектурное направление с выразительными объёмами, декоративностью и сложным оформлением.",
        tip:
            "Обрати внимание на лепнину, скульптуры, изогнутые линии и богатый декор."
    },

    "Конструктивизм": {
        description:
            "Конструктивизм делает акцент на функции здания, геометрии и выразительности конструкций.",
        tip:
            "Ищи простые геометрические формы, асимметрию и композицию, связанную с назначением здания."
    },

    "Брутализм": {
        description:
            "Брутализм часто использует массивные объёмы и открытые бетонные поверхности.",
        tip:
            "Обрати внимание на грубую фактуру бетона, тяжёлые формы и крупные выступающие элементы."
    },

    "Ар-деко": {
        description:
            "Ар-деко сочетает геометрические орнаменты, декоративность и выразительные силуэты.",
        tip:
            "Ищи ступенчатые формы, симметричные узоры, декоративный металл и геометрические мотивы."
    }
};

// Загружаем модель при открытии страницы.
async function loadModel() {
    try {
        modelStatus.textContent = "Загрузка модели распознавания...";
        model = await tmImage.load(
            MODEL_URL + "model.json",
            MODEL_URL + "metadata.json"
        );

        modelStatus.textContent =
            `Модель загружена. Классов: ${model.getTotalClasses()}.`;
        identifyButton.disabled = false;
    } catch (error) {
        console.error(error);
        modelStatus.textContent =
            "Не удалось загрузить модель по ссылке. Проверь интернет-соединение и доступность модели.";
        identifyButton.disabled = false;
    }
}

// Включаем камеру.
startCameraButton.addEventListener("click", async () => {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Камера недоступна. Используй HTTPS или localhost.");
        }

        stopCamera();

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 960 }
            },
            audio: false
        });

        video.srcObject = stream;
        video.hidden = false;
        preview.hidden = true;
        placeholder.hidden = true;

        await video.play();

        selectedImage = null;
        startCameraButton.textContent = "Перезапустить камеру";
        modelStatus.textContent = "Камера включена. Наведи её на фасад.";
    } catch (error) {
        console.error(error);
        modelStatus.textContent =
            "Не удалось включить камеру. Проверь разрешение браузера и подключение.";
    }
});

// Делаем фотографию с камеры.
captureButton.addEventListener("click", () => {
    if (!stream || video.readyState < 2) {
        modelStatus.textContent =
            "Сначала включи камеру или загрузи фотографию.";
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    selectedImage = new Image();
    selectedImage.src = canvas.toDataURL("image/jpeg", 0.95);

    selectedImage.onload = () => {
        preview.src = selectedImage.src;
        preview.hidden = false;
        video.hidden = true;
        placeholder.hidden = true;
        modelStatus.textContent =
            "Фото сделано. Теперь нажми «Определить стиль».";
    };

    stopCamera();
});

// Загружаем изображение с компьютера или телефона.
fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        modelStatus.textContent = "Выбери файл изображения.";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const image = new Image();

        image.onload = () => {
            selectedImage = image;
            preview.src = reader.result;
            preview.hidden = false;
            video.hidden = true;
            placeholder.hidden = true;

            stopCamera();

            modelStatus.textContent =
                "Изображение загружено. Можно запускать распознавание.";
        };

        image.onerror = () => {
            modelStatus.textContent = "Не удалось прочитать изображение.";
        };

        image.src = reader.result;
    };

    reader.onerror = () => {
        modelStatus.textContent = "Ошибка загрузки файла.";
    };

    reader.readAsDataURL(file);
});

// Определяем архитектурный стиль.
identifyButton.addEventListener("click", async () => {
    if (isPredicting) return;

    if (!selectedImage) {
        modelStatus.textContent =
            "Сначала сделай фото или загрузи изображение.";
        return;
    }

    if (!model) {
        modelStatus.textContent =
            "Сначала подключи обученную модель Teachable Machine.";
        return;
    }

    isPredicting = true;
    identifyButton.disabled = true;
    identifyButton.textContent = "Анализируем...";

    try {
        const predictions = await model.predict(selectedImage);

        predictions.sort((a, b) => b.probability - a.probability);

        const best = predictions[0];
        const confidence = Math.round(best.probability * 100);

        resultPlaceholder.hidden = true;
        result.hidden = false;

        document.getElementById("styleName").textContent = best.className;
        document.getElementById("confidence").textContent =
            confidence + "%";

        document.getElementById("confidenceBar").style.width =
            confidence + "%";

        const info = descriptions[best.className];

        if (info) {
            document.getElementById("styleDescription").textContent =
                info.description;
            document.getElementById("resultTip").textContent = info.tip;
        } else {
            document.getElementById("styleDescription").textContent =
                "Модель отнесла фотографию к этому классу. Сравни результат с признаками стилей в библиотеке ниже.";
            document.getElementById("resultTip").textContent =
                "Проверь другие вероятности и попробуй сделать снимок фасада прямо, при хорошем освещении.";
        }

        // Показываем несколько наиболее вероятных классов.
        const otherResults = predictions.slice(1, 4)
            .map(item =>
                `${item.className}: ${Math.round(item.probability * 100)}%`
            );

        document.getElementById("resultTip").textContent +=
            otherResults.length
                ? "\n\nДругие варианты: " + otherResults.join(" · ")
                : "";

        modelStatus.textContent =
            "Анализ завершён. Сравни результат с архитектурными признаками.";
    } catch (error) {
        console.error(error);
        modelStatus.textContent =
            "Ошибка распознавания. Проверь файлы модели и попробуй ещё раз.";
    } finally {
        isPredicting = false;
        identifyButton.disabled = false;
        identifyButton.textContent = "Определить стиль ↗";
    }
});

// Очищаем изображение и результат.
resetButton.addEventListener("click", () => {
    stopCamera();

    selectedImage = null;
    preview.removeAttribute("src");
    preview.hidden = true;
    video.hidden = true;
    placeholder.hidden = false;

    fileInput.value = "";

    result.hidden = true;
    resultPlaceholder.hidden = false;

    document.getElementById("confidenceBar").style.width = "0";
    document.getElementById("confidence").textContent = "0%";

    modelStatus.textContent = model
        ? "Модель готова к следующему изображению."
        : "Модель ещё не загружена.";
});

// Останавливаем камеру и освобождаем её ресурсы.
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.srcObject = null;
}

window.addEventListener("beforeunload", stopCamera);

identifyButton.disabled = true;
loadModel();
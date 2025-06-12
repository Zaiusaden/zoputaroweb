class DOMHelpers {
    static renderAvatar(producer, className) {
        const isImage = Formatters.isImageUrl(producer.avatar);
        
        if (isImage) {
            return `
                <div class="${className}" style="background-color: ${producer.color}; background-image: url('${producer.avatar}'); background-size: cover; background-position: center;">
                </div>
            `;
        } else {
            return `
                <div class="${className}" style="background: ${producer.color}">
                    ${producer.avatar}
                </div>
            `;
        }
    }

    static updateLanguageElements(currentLang) {
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(el => {
            const key = el.dataset.lang;
            if (translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });
    }

    static populateFilterOptions(selectElement, options) {
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }
}
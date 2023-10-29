const alphabetPath = "https://github.com/DCUGITHUBZONE/bitmap_image_to_text/tree/main/alphabet";

async function loadImage(letter) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image for letter: ${letter}`));
        img.src = `${alphabetPath}${letter.toUpperCase()}.png`;
    });
}

async function generateImage(text) {
    const canvas = document.getElementById('imagePreview');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    for (const letter of text) {
        if (letter.match(/[a-zA-Z]/)) {
            const img = await loadImage(letter);
            ctx.drawImage(img, x, 0, img.width, img.height);
            x += img.width;
        }
    }
}


function updatePreview() {
    const textInput = document.getElementById('textInput');
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.classList.add('animate');
    generateImage(textInput.value);
}

function downloadImage() {
    const canvas = document.getElementById('imagePreview');
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const link = document.createElement('a');
    link.download = 'text-image.png';
    link.href = image;
    link.click();
}

  document.getElementById('textInput').addEventListener('input', updatePreview);
</script>
</body>
</html>

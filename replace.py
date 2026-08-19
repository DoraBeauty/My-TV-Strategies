with open('app.js', 'r') as f:
    content = f.read()

search_text = """            } else if (ticketData.amount > 0 && ticketData.imagePath === null && record.isSettled) {
                // If there's an amount, it's settled, and the imagePath is explicitly null, it means it was cleaned up
                thumbContainer.innerHTML = `<span class="badge bg-secondary mt-2">圖片已清除</span>`;
                thumbContainer.dataset.url = '';
                thumbContainer.dataset.path = '';
            }"""

replacement = """            } else if (ticketData.amount > 0 && ticketData.imagePath === null) {
                // If there's an amount and the imagePath is explicitly null (likely cleaned up)
                thumbContainer.innerHTML = `<span class="badge bg-secondary mt-2">圖片已清除</span>`;
                thumbContainer.dataset.url = '';
                thumbContainer.dataset.path = '';
            }"""

if search_text not in content:
    print("Exact string not found!")
else:
    new_content = content.replace(search_text, replacement)
    with open('app.js', 'w') as f:
        f.write(new_content)
    print("Replaced successfully")

import re

with open('index.html', 'r') as f:
    content = f.read()

# Since equipmentModal is stacked inside #recordModal or opened while #recordModal is open, it might cause issues with data-bs-dismiss.
# Bootstrap uses data-bs-target when you want to toggle a specific modal or we can use data-bs-dismiss="modal" which will close the *closest* modal.
# Is #equipmentModal nested inside #recordModal in index.html?

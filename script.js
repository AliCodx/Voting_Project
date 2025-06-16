document.getElementById('voteForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from reloading the page
    const rollNo = document.getElementById('rollNo').value.trim();
    const studentCard = document.getElementById('studentCard').files[0];
    const candidate = document.querySelector('input[name="candidate"]:checked');
    const resultDiv = document.getElementById('result');

    if (!rollNo || !studentCard || !candidate) {
        resultDiv.textContent = 'Please fill all fields.';
        resultDiv.style.color = 'red';
        return;
    }

    // Prepare form data for backend
    const formData = new FormData();
    formData.append('rollNo', rollNo);
    formData.append('studentCard', studentCard);
    formData.append('candidate', candidate.value);

    fetch('http://localhost:3000/api/vote', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            resultDiv.innerHTML = `<p>Thank you for voting for <b>${candidate.value}</b>!</p><p>Roll No: ${rollNo}</p>`;
            resultDiv.style.color = 'green';
            alert(`You have voted successfully to ${candidate.value}`);
        } else {
            resultDiv.textContent = data.error || 'An error occurred.';
            resultDiv.style.color = 'red';
        }
    })
    .catch(() => {
        resultDiv.textContent = 'Failed to submit vote. Please try again.';
        resultDiv.style.color = 'red';
    });
});
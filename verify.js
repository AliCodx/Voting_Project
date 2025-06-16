// Fetch and display all pending votes for verification
function loadPendingVotes() {
    fetch('http://localhost:3000/api/votes?status=pending')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load votes.');
            return res.json();
        })
        .then(data => {
            const tbody = document.querySelector('#verifyTable tbody');
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No pending votes.</td></tr>';
            } else {
                data.forEach(row => {
                    const imgSrc = row.imagePath ? `http://localhost:3000/${row.imagePath.replace(/\\/g,'/')}` : '';
                    tbody.innerHTML += `<tr>
                        <td>${row.rollNo}</td>
                        <td>${row.candidate}</td>
                        <td>${imgSrc ? `<a href="${imgSrc}" target="_blank"><img src="${imgSrc}" alt="Student Card" style="max-width:100px;max-height:80px;"></a>` : 'No Image'}</td>
                        <td>${row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                        <td>
                            <button class="verifyBtn" data-id="${row.id}" data-status="verified">Verify</button>
                            <button class="verifyBtn" data-id="${row.id}" data-status="rejected" style="background:#dc3545;">Reject</button>
                        </td>
                    </tr>`;
                });
            }
        })
        .catch(error => {
            const tbody = document.querySelector('#verifyTable tbody');
            tbody.innerHTML = `<tr><td colspan="5" style="color:red;">${error.message}</td></tr>`;
        });
}

document.addEventListener('DOMContentLoaded', function() {
    loadPendingVotes();
    document.getElementById('refreshBtn').addEventListener('click', loadPendingVotes);
    // Add event for delete all button
    document.getElementById('deleteAllBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all votes? This cannot be undone.')) {
            fetch('http://localhost:3000/api/clear-votes', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('All votes deleted.');
                        loadPendingVotes();
                    } else {
                        alert(data.error || 'Failed to delete votes.');
                    }
                })
                .catch(() => {
                    alert('Failed to delete votes.');
                });
        }
    });
    document.querySelector('#verifyTable tbody').addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('verifyBtn')) {
            const id = e.target.getAttribute('data-id');
            const status = e.target.getAttribute('data-status');
            e.target.disabled = true;
            e.target.textContent = 'Processing...';
            fetch(`http://localhost:3000/api/votes/${id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => { throw new Error(text); });
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    // Replace the action buttons with the new status
                    const row = e.target.closest('tr');
                    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
                    const statusColor = status === 'verified' ? '#28a745' : '#dc3545';
                    row.querySelector('td:last-child').innerHTML = `<span style="color:${statusColor};font-weight:bold;">${statusText}</span>`;
                } else {
                    alert(data.error || 'Failed to update status.');
                }
            })
            .catch(error => {
                alert(error.message || 'Failed to update status.');
            });
        }
    });
});
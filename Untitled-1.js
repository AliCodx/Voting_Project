app.post('/api/votes/:id/verify', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log('Attempting to update vote:', { id, status });
    if (!['verified', 'rejected'].includes(status)) {
        console.log('Invalid status:', status);
        return res.status(400).json({ error: 'Invalid status.' });
    }
    db.run('UPDATE votes SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            console.log('Database error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (this.changes === 0) {
            console.log('No vote found with id:', id);
            return res.status(404).json({ error: 'Vote not found.' });
        }
        console.log('Vote updated successfully:', { id, status });
        res.json({ success: true });
    });
});
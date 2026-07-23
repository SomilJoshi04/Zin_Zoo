import axios from 'axios';

async function test() {
    try {
        const payload = {
            name: 'soft drinks',
            type: 'drinks',
            status: true,
            zoneId: null
        };
        const res = await axios.post('http://localhost:5000/api/food/admin/categories', payload, {
            headers: {
                // we probably need auth token?
            }
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error Status:", err.response?.status);
        console.error("Error Data:", err.response?.data || err.message);
    }
}
test();

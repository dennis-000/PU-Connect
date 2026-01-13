export const sendSMS = async (recipients: string[], message: string) => {
    const apiKey = 'RHNPVVNWaU5uYW1hcllVVXJvZlY';
    try {
        const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender: 'PU Connect',
                message: message,
                recipients: recipients,
            }),
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Arkesel SMS Error:', error);
        return { success: false, error };
    }
};

export const getDateData = (isoDate) => {
    const dateStr = new Date(isoDate).toString();
    const date = new Date(isoDate);
    const today = new Date(Date.now());
    const regex = /(\w{3}) (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):\d{2}/;
    const match = dateStr.match(regex);
    if (match) {
        const year = Number(match[4])
        const month = match[2];
        const day = Number(match[3]);
        const hours = match[5];
        const minutes = match[6];
        const dateString = `${day} ${month} ${year}`
        const timeString = `${hours}:${minutes}`

        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        const givenMonth = date.getMonth();
        // gives an date name
        let dayStr = "";
        if (todayDate === day && todayMonth === givenMonth && todayYear === year) {
            dayStr = "Today"
        } else if ((todayDate - day === 1 && todayMonth === givenMonth && todayYear === year)
            || (todayDate < day && today + 30 - day <= 1 && ((todayMonth - givenMonth === 1 && todayYear === year) || (todayMonth < givenMonth && todayYear - year === 1)))
        ) {
            dayStr = "Yesterday"
        }
        else {
            dayStr = dateString
        }

        return ({ year, month, day, dateString, dayStr, hours, minutes, timeString })
    }
}
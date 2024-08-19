import { format } from "date-fns";

export const Iso8601DateFormat = (dateObj:Date) => {
	return `${format(dateObj, "yyyy-MM-dd")}T${format(dateObj, "hh:mm:ss")}Z`;
}

export const ReadableDateFormat = (dateObj:Date) => {
	return format(dateObj, "MMMM do, yyyy");
}

const addMovie = (req, res) => {
    try {
        res.status(201).json({ message: "added new movie" });
    } catch (error) {
        console.log(error);
    }
};

module.exports = { addMovie };

class Fox(Familiar):
    def __init__(self, color, name):
        self.name = name
        self.color = color

pimu = Fox("Pimu", "red")
wizard.cast("minka", pimu)

class Fox(Familiar):
    def __init__(self, name, color):
        self.name = name
        self.color = "white"

    def go_to(self, x, y):
        if x < self.position.x:
            self.move_left(self.position.x - x)
        else:
            self.move_right(x - self.position.x)
        if y < self.position.y:
            self.move_up(self.position.y - y)
        else:
            self.move_down(y - self.position.y)

pimu.go_to(13, 4)

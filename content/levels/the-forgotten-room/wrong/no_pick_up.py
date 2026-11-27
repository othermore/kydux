pimu.go_to(10, 8)
pimu.go_to(13, 8)
pimu.go_to(13, 3)
for piece in wizard.find_all("thread"):
    pimu.go_to(piece.position.x, piece.position.y)
wizard.cast("minka", pimu)

export interface ExampleCode {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const EXAMPLES: ExampleCode[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: '经典的 Hello World 程序',
    code: `public class HelloWorld {
    private String name;

    public HelloWorld(String name) {
        this.name = name;
    }

    public void sayHello() {
        String message = "Hello, " + this.name + "!";
        System.out.println(message);
    }

    public static void main(String[] args) {
        HelloWorld hw = new HelloWorld("JaJS");
        hw.sayHello();
    }
}`,
  },
  {
    id: 'calculator',
    name: '计算器类',
    description: '演示类、方法和运算符',
    code: `public class Calculator {
    private double result;

    public Calculator() {
        this.result = 0.0;
    }

    public void add(double value) {
        this.result = this.result + value;
    }

    public void subtract(double value) {
        this.result = this.result - value;
    }

    public void multiply(double value) {
        this.result = this.result * value;
    }

    public void divide(double value) {
        if (value != 0) {
            this.result = this.result / value;
        }
    }

    public double getResult() {
        return this.result;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        calc.add(10);
        calc.multiply(2);
        calc.subtract(5);
        System.out.println(calc.getResult());
    }
}`,
  },
  {
    id: 'inheritance',
    name: '继承与多态',
    description: '演示类继承和方法重写',
    code: `public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void makeSound() {
        System.out.println("Some sound");
    }

    public String getName() {
        return this.name;
    }
}

public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name);
        this.breed = breed;
    }

    @Override
    public void makeSound() {
        System.out.println("Woof! Woof!");
    }

    public String getBreed() {
        return this.breed;
    }

    public static void main(String[] args) {
        Animal dog = new Dog("Buddy", "Golden Retriever");
        dog.makeSound();
        System.out.println(dog.getName());
    }
}`,
  },
  {
    id: 'fibonacci',
    name: '斐波那契数列',
    description: '演示循环和条件判断',
    code: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        int prev = 0;
        int curr = 1;
        for (int i = 2; i <= n; i++) {
            int next = prev + curr;
            prev = curr;
            curr = next;
        }
        return curr;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            int result = Fibonacci.fibonacci(i);
            System.out.println("F(" + i + ") = " + result);
        }
    }
}`,
  },
  {
    id: 'try-catch',
    name: '异常处理',
    description: '演示 try-catch-finally 异常处理',
    code: `public class ExceptionDemo {
    public static int divide(int a, int b) {
        if (b == 0) {
            throw new Error("Cannot divide by zero");
        }
        return a / b;
    }

    public static void main(String[] args) {
        try {
            int result = ExceptionDemo.divide(10, 0);
            System.out.println("Result: " + result);
        } catch (Error e) {
            System.out.println("Error: " + e.message);
        } finally {
            System.out.println("Execution completed");
        }

        try {
            int result = ExceptionDemo.divide(10, 2);
            System.out.println("Result: " + result);
        } catch (Error e) {
            System.out.println("Error: " + e.message);
        }
    }
}`,
  },
  {
    id: 'type-error',
    name: '类型错误示例',
    description: '演示类型检查器捕获的错误',
    code: `public class TypeDemo {
    public static void main(String[] args) {
        int x = "hello";
        String y = 123;
        int z = x + y;
    }
}`,
  },
  {
    id: 'dom-manipulation',
    name: 'DOM 操作',
    description: '演示 Document 和 Window 全局对象的使用',
    code: `public class DOMDemo {
    public static void main(String[] args) {
        System.out.println("页面标题: " + Document.title);
        System.out.println("窗口宽度: " + Window.innerWidth);
        System.out.println("窗口高度: " + Window.innerHeight);
        
        HTMLElement body = Document.body;
        System.out.println("Body 存在: " + (body != null));
        
        HTMLElement el = Document.getElementById("myDiv");
        if (el != null) {
            el.innerHTML = "<h1>Hello from JaJS!</h1>";
        }
    }
}`,
  },
  {
    id: 'window-methods',
    name: 'Window 全局方法',
    description: '演示 alert、prompt、setTimeout 等全局方法',
    code: `public class WindowDemo {
    public static void main(String[] args) {
        alert("Hello from JaJS!");
        
        int num = parseInt("42");
        System.out.println("parseInt('42') = " + num);
        
        double pi = Math.PI;
        System.out.println("PI = " + pi);
        
        double sqrt = Math.sqrt(16);
        System.out.println("sqrt(16) = " + sqrt);
        
        double random = Math.random();
        System.out.println("random = " + random);
        
        String json = JSON.stringify("hello");
        System.out.println("JSON: " + json);
        
        long now = Date.now();
        System.out.println("timestamp: " + now);
    }
}`,
  },
  {
    id: 'math-json',
    name: 'Math 和 JSON',
    description: '演示内置 Math 和 JSON 对象的使用',
    code: `public class MathJSONDemo {
    public static void main(String[] args) {
        double x = 2.5;
        double y = 3.7;
        
        System.out.println("max(" + x + ", " + y + ") = " + Math.max(x, y));
        System.out.println("min(" + x + ", " + y + ") = " + Math.min(x, y));
        System.out.println("pow(" + x + ", 2) = " + Math.pow(x, 2));
        System.out.println("ceil(" + x + ") = " + Math.ceil(x));
        System.out.println("floor(" + y + ") = " + Math.floor(y));
        System.out.println("round(" + x + ") = " + Math.round(x));
        System.out.println("abs(-5) = " + Math.abs(-5));
        
        int[] nums = {1, 2, 3, 4, 5};
        String jsonStr = JSON.stringify(nums);
        System.out.println("序列化数组: " + jsonStr);
    }
}`,
  },
  {
    id: 'global-functions',
    name: '全局函数',
    description: '演示 parseInt、parseFloat、isNaN 等全局函数的使用',
    code: `public class GlobalFunctionsDemo {
    public static void main(String[] args) {
        int i = parseInt("123");
        System.out.println("parseInt('123') = " + i);
        
        double d = parseFloat("3.14");
        System.out.println("parseFloat('3.14') = " + d);
        
        boolean nan = isNaN(0.0 / 0.0);
        System.out.println("isNaN(0/0) = " + nan);
        
        boolean finite = isFinite(100);
        System.out.println("isFinite(100) = " + finite);
        
        String url = "https://example.com/path?q=hello world";
        String encoded = encodeURI(url);
        System.out.println("encodeURI: " + encoded);
        
        String decoded = decodeURI(encoded);
        System.out.println("decodeURI: " + decoded);
        
        println("使用 println 全局函数输出");
    }
}`,
  },
];

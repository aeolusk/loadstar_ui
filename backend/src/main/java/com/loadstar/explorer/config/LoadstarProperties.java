package com.loadstar.explorer.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "loadstar")
public class LoadstarProperties {

    private Search search = new Search();

    @Data
    public static class Search {
        private int maxResults = 50;
        private int snippetLines = 3;
        private int minQueryLength = 2;
    }
}
